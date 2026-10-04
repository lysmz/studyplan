import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { join, relative, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import { app } from 'electron'
import type { PowerSyncDatabase } from '@powersync/node'
import {
  aliceId,
  groupId,
  ScriptedBackend
} from '../../../scripts/collaboration/helpers/scripted-backend'
import { openCollaborationDatabase } from './database'
import { CollaborationTasksRepository } from './repositories'
import { LocalUploadFailureStore } from './upload-failures'
import { uploadTaskTransaction, type UploadFailureStore } from './upload'

const crashTask = '88888888-8888-4888-8888-888888888888'
type Check = { name: string; status: 'pass'; evidence: Record<string, unknown> }

function withAcknowledgement(
  database: PowerSyncDatabase,
  complete: () => Promise<void>
): PowerSyncDatabase {
  return new Proxy(database, {
    get(target, key) {
      if (key === 'getNextCrudTransaction')
        return async () => {
          const transaction = await target.getNextCrudTransaction()
          return transaction && { ...transaction, complete }
        }
      const value = Reflect.get(target, key)
      return typeof value === 'function' ? value.bind(target) : value
    }
  })
}

// Called only by the parent smoke check, with a newly generated temporary directory.
export async function runUploadCrashChild(directory: string, temporaryRoot: string): Promise<void> {
  const resolved = resolve(directory)
  const inside = relative(resolve(temporaryRoot), resolved)
  if (
    inside.startsWith('..') ||
    !inside ||
    !resolved.split(/[\\/]/).at(-1)?.startsWith('studyplan-upload-')
  ) {
    throw new Error('Crash fixture must be inside the generated temporary test directory.')
  }
  const database = await openCollaborationDatabase(resolved, 'crash.db')
  const backend = new ScriptedBackend()
  backend.denied.add(crashTask)
  await uploadTaskTransaction(
    withAcknowledgement(database.powerSync, async () => {
      app.exit(0) // Deliberate process exit with the journal committed and the queue unacknowledged.
      await new Promise(() => undefined)
    }),
    backend.client(),
    aliceId,
    new LocalUploadFailureStore(database.powerSync, aliceId)
  )
  throw new Error('Crash boundary was not reached.')
}

async function drain(
  database: PowerSyncDatabase,
  backend: ScriptedBackend,
  store: UploadFailureStore
): Promise<void> {
  while ((await database.getUploadQueueStats()).count) {
    await uploadTaskTransaction(database, backend.client(), aliceId, store)
  }
}

export async function runUploadQueueChecks(temporaryRoot: string): Promise<Check[]> {
  const directory = await mkdtemp(join(temporaryRoot, 'studyplan-upload-'))
  const checks: Check[] = []
  let database = await openCollaborationDatabase(directory, 'queue.db')
  try {
    let tasks = new CollaborationTasksRepository(database.drizzle)
    let store = new LocalUploadFailureStore(database.powerSync, aliceId)
    const backend = new ScriptedBackend()
    const rejected = await tasks.create({
      groupId,
      actorId: aliceId,
      title: 'Preserved draft',
      description: 'Keep this text'
    })
    backend.denied.add(rejected.id)
    await tasks.update(rejected.id, groupId, aliceId, { title: 'Later draft', description: null })
    await tasks.delete(rejected.id, groupId)
    const valid = await tasks.create({ groupId, actorId: aliceId, title: 'Unrelated valid task' })
    const replica = await database.powerSync.getClientId()
    const unavailableStore: UploadFailureStore = {
      find: (id) => store.find(id),
      hasTask: (id) => store.hasTask(id),
      list: () => store.list(),
      save: async () => {
        throw new Error('Injected journal write failure')
      }
    }
    await assert.rejects(
      uploadTaskTransaction(database.powerSync, backend.client(), aliceId, unavailableStore),
      /journal write failure/
    )
    assert.equal((await database.powerSync.getUploadQueueStats()).count, 4)
    assert.equal((await store.list()).length, 0)
    await database.powerSync.close()
    database = await openCollaborationDatabase(directory, 'queue.db')
    store = new LocalUploadFailureStore(database.powerSync, aliceId)
    assert.equal((await database.powerSync.getUploadQueueStats()).count, 4)
    await drain(database.powerSync, backend, store)
    const failures = await store.list()
    assert.equal(failures.length, 3)
    assert.equal(failures.filter((f) => f.reason === 'DEPENDENCY_REJECTED').length, 2)
    assert.equal(failures.find((f) => f.operation === 'PUT')?.changes.description, 'Keep this text')
    assert.equal(failures.find((f) => f.operation === 'PATCH')?.changes.description, null)
    assert.equal(failures.find((f) => f.operation === 'DELETE')?.snapshot?.title, 'Later draft')
    assert.equal(backend.rows.get(valid.id)?.title, 'Unrelated valid task')
    assert.equal(
      (await database.powerSync.getUploadQueueStats()).count,
      0,
      'Journal must be local-only'
    )
    await database.powerSync.close()
    database = await openCollaborationDatabase(directory, 'queue.db')
    store = new LocalUploadFailureStore(database.powerSync, aliceId)
    tasks = new CollaborationTasksRepository(database.drizzle)
    assert.equal(await database.powerSync.getClientId(), replica)
    assert.deepEqual(await store.list(), failures)
    assert.equal(
      (await new LocalUploadFailureStore(database.powerSync, 'another-user').list()).length,
      0
    )
    await assert.rejects(
      new LocalUploadFailureStore(database.powerSync, 'another-user').save(failures[0])
    )
    const otherAccount = await openCollaborationDatabase(directory, 'other-account.db')
    try {
      assert.equal(
        (await new LocalUploadFailureStore(otherAccount.powerSync, 'another-user').list()).length,
        0
      )
    } finally {
      await otherAccount.powerSync.close()
    }
    checks.push({
      name: 'Q1/Q4/Q6/Q7: journal write failure, dependency preservation and account-isolated restart',
      status: 'pass',
      evidence: {
        rejected: 3,
        pending: 0,
        pendingDuringJournalFailure: 4,
        validTaskUploaded: true,
        replicaStable: true,
        journalEnqueuedWrites: 0,
        deletedSnapshotPreserved: true
      }
    })

    const missing = await tasks.create({ groupId, actorId: aliceId, title: 'Missing on server' })
    await (await database.powerSync.getNextCrudTransaction())?.complete() // fixture only; never uploaded
    await tasks.update(missing.id, groupId, aliceId, { description: 'Preserve zero-row edit' })
    await drain(database.powerSync, backend, store)
    assert.equal(
      (await store.list()).find((f) => f.taskId === missing.id)?.changes.description,
      'Preserve zero-row edit'
    )
    checks.push({
      name: 'Z1: real PATCH for a missing server task retains the edit',
      status: 'pass',
      evidence: { durableRejection: true, pending: 0 }
    })

    const transient = await tasks.create({ groupId, actorId: aliceId, title: 'Temporary failure' })
    backend.failOnce = transient.id
    await assert.rejects(
      uploadTaskTransaction(database.powerSync, backend.client(), aliceId, store)
    )
    const pending = (await database.powerSync.getUploadQueueStats()).count
    await database.powerSync.close()
    database = await openCollaborationDatabase(directory, 'queue.db')
    store = new LocalUploadFailureStore(database.powerSync, aliceId)
    assert.equal((await database.powerSync.getUploadQueueStats()).count, pending)
    await drain(database.powerSync, backend, store)
    assert.equal(backend.rows.get(transient.id)?.title, 'Temporary failure')
    checks.push({
      name: 'Q2: transient failure preserves the real queue across restart',
      status: 'pass',
      evidence: { pendingDuringFailure: pending, pendingAfterRecovery: 0 }
    })

    // Real SQLite transaction: A commits remotely; B fails; retry must not reapply A.
    const a = crypto.randomUUID(),
      b = crypto.randomUUID()
    await database.powerSync.writeTransaction(async (tx) => {
      for (const [id, title] of [
        [a, 'Alice original'],
        [b, 'Second task']
      ]) {
        await tx.execute(
          'INSERT INTO group_tasks (id, group_id, title, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [id, groupId, title, 'open', aliceId, new Date().toISOString(), new Date().toISOString()]
        )
      }
    })
    assert.equal((await database.powerSync.getNextCrudTransaction())?.crud.length, 2)
    backend.failOnce = b
    await assert.rejects(
      uploadTaskTransaction(database.powerSync, backend.client(), aliceId, store)
    )
    backend.rows.set(a, { ...backend.rows.get(a), title: 'Bob newer edit' })
    await drain(database.powerSync, backend, store)
    assert.equal(backend.rows.get(a)?.title, 'Bob newer edit')
    assert.equal(backend.rows.get(b)?.title, 'Second task')
    checks.push({
      name: 'R1: real multi-operation transaction safely replays partial success',
      status: 'pass',
      evidence: { transactionOperations: 2, bobEditPreserved: true, pending: 0 }
    })

    await database.powerSync.close()
    database = await openCollaborationDatabase(directory, 'crash.db')
    await database.powerSync.execute(
      'INSERT INTO group_tasks (id, group_id, title, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        crashTask,
        groupId,
        'Crash preserved draft',
        'open',
        aliceId,
        new Date().toISOString(),
        new Date().toISOString()
      ]
    )
    tasks = new CollaborationTasksRepository(database.drizzle)
    const afterCrash = await tasks.create({ groupId, actorId: aliceId, title: 'After crash' })
    await database.powerSync.close()
    await new Promise<void>((resolveChild, rejectChild) => {
      const child = spawn(
        process.execPath,
        [app.getAppPath(), `--powersync-upload-crash=${directory}`],
        { windowsHide: true, stdio: 'ignore' }
      )
      const timer = setTimeout(() => {
        child.kill()
        rejectChild(new Error('Crash check timed out.'))
      }, 30_000)
      child.once('error', (error) => {
        clearTimeout(timer)
        rejectChild(error)
      })
      child.once('exit', (code) => {
        clearTimeout(timer)
        if (code === 0) resolveChild()
        else rejectChild(new Error(`Crash child exited ${code}`))
      })
    })
    database = await openCollaborationDatabase(directory, 'crash.db')
    store = new LocalUploadFailureStore(database.powerSync, aliceId)
    assert.equal((await store.list()).length, 1)
    assert.equal((await database.powerSync.getUploadQueueStats()).count, 2)
    await drain(database.powerSync, backend, store)
    assert.equal((await store.list()).length, 1)
    assert.equal(backend.rows.get(afterCrash.id)?.title, 'After crash')
    checks.push({
      name: 'Q4/Q5: forced exit after journal commit recovers before acknowledgement',
      status: 'pass',
      evidence: {
        rejectedAfterRestart: 1,
        pendingAfterRestart: 2,
        rejectedAfterRecovery: 1,
        pendingAfterRecovery: 0
      }
    })
    await database.powerSync.close()
    database = await openCollaborationDatabase(directory, 'identity-a.db')
    await new CollaborationTasksRepository(database.drizzle).create({
      groupId,
      actorId: aliceId,
      title: 'Replica A'
    })
    const identityA = {
      replica: await database.powerSync.getClientId(),
      sequence: (await database.powerSync.getNextCrudTransaction())?.crud[0].clientId
    }
    await database.powerSync.close()
    database = await openCollaborationDatabase(directory, 'identity-b.db')
    await new CollaborationTasksRepository(database.drizzle).create({
      groupId,
      actorId: aliceId,
      title: 'Replica B'
    })
    const identityB = {
      replica: await database.powerSync.getClientId(),
      sequence: (await database.powerSync.getNextCrudTransaction())?.crud[0].clientId
    }
    assert.equal(identityA.sequence, identityB.sequence)
    assert.notEqual(identityA.replica, identityB.replica)
    await database.powerSync.close()
    database = await openCollaborationDatabase(directory, 'identity-a.db')
    assert.deepEqual(
      {
        replica: await database.powerSync.getClientId(),
        sequence: (await database.powerSync.getNextCrudTransaction())?.crud[0].clientId
      },
      identityA
    )
    checks.push({
      name: 'R5: queue identities differ by replica and remain stable across restart',
      status: 'pass',
      evidence: { equalSequences: true, differentReplicas: true, identityStableAfterRestart: true }
    })
    return checks
  } finally {
    await database.powerSync.close().catch(() => undefined)
    await rm(directory, { recursive: true, force: true })
  }
}
