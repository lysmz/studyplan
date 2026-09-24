import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { PowerSyncDrizzleEventsRepository } from './event.repository'
import { openPowerSyncDrizzleDatabase } from './database'
import { inspectExistingEventsCompatibility } from './schema'

interface DrizzleSpikeCheck {
  name: string
  status: 'pass'
  evidence: Record<string, unknown>
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export async function runElectronPowerSyncDrizzleChecks(
  temporaryRoot: string
): Promise<DrizzleSpikeCheck[]> {
  const directory = await mkdtemp(join(temporaryRoot, 'studyplan-powersync-drizzle-'))
  const checks: DrizzleSpikeCheck[] = []

  try {
    const compatibility = inspectExistingEventsCompatibility()
    requireCondition(
      compatibility.requiresIdMigration,
      'The integer ID migration was not detected.'
    )
    requireCondition(
      compatibility.requiresOwnerMigration,
      'The local integer user ID migration was not detected.'
    )
    requireCondition(
      compatibility.mappedColumns.start_date === 'INTEGER',
      'The existing timestamp mapping was not recorded.'
    )
    checks.push({
      name: 'existing events compatibility assessment',
      status: 'pass',
      evidence: { ...compatibility }
    })

    let database = await openPowerSyncDrizzleDatabase(directory, 'events.db')
    let repository = new PowerSyncDrizzleEventsRepository(database.drizzle)
    const first = await repository.createEvent({
      ownerId: 'alice',
      title: 'Distributed Systems exam',
      description: 'Room A1',
      startDate: new Date('2026-10-12T08:00:00.000Z'),
      endDate: new Date('2026-10-12T10:00:00.000Z'),
      type: 'exam',
      importance: 'high',
      isMultiDay: false,
      location: 'Campus'
    })
    await repository.createManyEvents([
      {
        ownerId: 'alice',
        title: 'Registration deadline',
        startDate: new Date('2026-10-05T12:00:00.000Z'),
        endDate: new Date('2026-10-05T12:30:00.000Z'),
        type: 'registration',
        importance: 'medium',
        isMultiDay: false
      },
      {
        ownerId: 'bob',
        title: 'Bob event',
        startDate: new Date('2026-10-01T12:00:00.000Z'),
        endDate: new Date('2026-10-01T13:00:00.000Z'),
        type: 'other',
        importance: 'low',
        isMultiDay: false
      }
    ])

    const filtered = await repository.listByOwnerId('alice', {
      startsAtOrAfter: new Date('2026-10-10T00:00:00.000Z'),
      type: 'exam',
      importance: 'high'
    })
    requireCondition(
      filtered.length === 1 && filtered[0].id === first.id,
      'Drizzle filters failed.'
    )
    requireCondition(filtered[0].startDate instanceof Date, 'Date mapping failed.')
    const updated = await repository.updateByIdAndOwnerId(first.id, 'alice', {
      title: 'Distributed Systems exam – updated',
      location: 'Campus B'
    })
    requireCondition(updated?.location === 'Campus B', 'Drizzle update/returning failed.')
    checks.push({
      name: 'typed Drizzle repository CRUD and filters',
      status: 'pass',
      evidence: { createdId: first.id, filteredRows: filtered.length, updated: updated?.title }
    })

    const queuedBeforeRestart = (await database.powerSync.getUploadQueueStats()).count
    await database.powerSync.close()
    database = await openPowerSyncDrizzleDatabase(directory, 'events.db')
    repository = new PowerSyncDrizzleEventsRepository(database.drizzle)
    const persisted = await repository.findByIdAndOwnerId(first.id, 'alice')
    const queuedAfterRestart = (await database.powerSync.getUploadQueueStats()).count
    requireCondition(persisted?.id === first.id, 'The Drizzle event did not survive restart.')
    requireCondition(
      queuedBeforeRestart >= 3 && queuedAfterRestart === queuedBeforeRestart,
      'The Drizzle-backed upload queue did not survive restart.'
    )
    checks.push({
      name: 'Drizzle offline restart durability',
      status: 'pass',
      evidence: { eventId: first.id, queuedBeforeRestart, queuedAfterRestart }
    })

    const deleted = await repository.deleteByIdAndOwnerId(first.id, 'alice')
    const afterDelete = await repository.findByIdAndOwnerId(first.id, 'alice')
    requireCondition(deleted?.id === first.id && !afterDelete, 'Drizzle delete/returning failed.')
    await database.powerSync.close()
    checks.push({
      name: 'Drizzle delete returning',
      status: 'pass',
      evidence: { eventId: first.id, deleted: true }
    })

    return checks
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
