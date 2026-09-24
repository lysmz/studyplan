import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { openPowerSyncSpikeDatabase } from './database'
import { powerSyncSpikeSchemaV1, powerSyncSpikeSchemaV2 } from './schema'
import { PowerSyncSpikeTaskRepository } from './task.repository'

interface SpikeCheck {
  name: string
  status: 'pass'
  evidence: Record<string, unknown>
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export async function runElectronPowerSyncSpikeChecks(
  temporaryRoot: string
): Promise<SpikeCheck[]> {
  const directory = await mkdtemp(join(temporaryRoot, 'studyplan-powersync-electron-'))
  const checks: SpikeCheck[] = []

  try {
    let database = await openPowerSyncSpikeDatabase({
      directory,
      filename: 'restart.db',
      schema: powerSyncSpikeSchemaV2
    })
    let repository = new PowerSyncSpikeTaskRepository(database)
    const created = await repository.create({
      ownerId: 'alice',
      title: 'Created while offline',
      priority: 'medium'
    })
    const queuedBeforeRestart = (await database.getUploadQueueStats()).count
    await database.close()

    database = await openPowerSyncSpikeDatabase({
      directory,
      filename: 'restart.db',
      schema: powerSyncSpikeSchemaV2
    })
    repository = new PowerSyncSpikeTaskRepository(database)
    const persisted = await repository.listForOwner('alice')
    const queuedAfterRestart = (await database.getUploadQueueStats()).count
    await database.close()

    requireCondition(
      persisted.length === 1 && persisted[0]?.id === created.id,
      'The offline task did not survive the Electron process database restart.'
    )
    requireCondition(
      queuedBeforeRestart >= 1 && queuedAfterRestart >= 1,
      'The PowerSync upload queue did not survive the database restart.'
    )
    checks.push({
      name: 'offline restart durability',
      status: 'pass',
      evidence: { taskId: created.id, queuedBeforeRestart, queuedAfterRestart }
    })

    database = await openPowerSyncSpikeDatabase({
      directory,
      filename: 'schema.db',
      schema: powerSyncSpikeSchemaV1
    })
    const versionOneId = crypto.randomUUID()
    const timestamp = new Date().toISOString()
    await database.execute(
      `INSERT INTO spike_tasks (id, owner_id, title, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [versionOneId, 'alice', 'Version one row', 'open', timestamp, timestamp]
    )
    await database.close()

    database = await openPowerSyncSpikeDatabase({
      directory,
      filename: 'schema.db',
      schema: powerSyncSpikeSchemaV2
    })
    repository = new PowerSyncSpikeTaskRepository(database)
    const beforeUpdate = await repository.listForOwner('alice')
    requireCondition(beforeUpdate[0]?.id === versionOneId, 'The v1 row was lost after opening v2.')
    requireCondition(beforeUpdate[0]?.priority === null, 'The additive column was not nullable.')
    const afterUpdate = await repository.updatePriority(versionOneId, 'high')
    await database.close()
    requireCondition(afterUpdate.priority === 'high', 'The v2 priority update did not persist.')
    checks.push({
      name: 'client schema v1 to v2',
      status: 'pass',
      evidence: { taskId: versionOneId, priority: afterUpdate.priority }
    })

    database = await openPowerSyncSpikeDatabase({
      directory,
      filename: 'crud.db',
      schema: powerSyncSpikeSchemaV2
    })
    repository = new PowerSyncSpikeTaskRepository(database)
    const crudTask = await repository.create({ ownerId: 'alice', title: 'CRUD probe' })
    const completed = await repository.setStatus(crudTask.id, 'done')
    const deleted = await repository.delete(crudTask.id)
    const remaining = await repository.listForOwner('alice')
    await database.close()
    requireCondition(completed.status === 'done', 'The status update failed.')
    requireCondition(deleted && remaining.length === 0, 'The bounded delete operation failed.')
    checks.push({
      name: 'bounded repository CRUD',
      status: 'pass',
      evidence: { taskId: crudTask.id, finalStatus: completed.status, deleted }
    })

    return checks
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
