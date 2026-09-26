import assert from 'node:assert/strict'
import { createClient } from '@supabase/supabase-js'
import type { CollaborationConnection, CollaborationRemoteConfig } from './connector'
import { SupabaseCollaborationConnector } from './connector'
import type { CollaborationDatabase } from './database'
import { CollaborationTasksRepository } from './repositories'
import { SupabaseCollaborationGateway } from './online-gateway'
import { LocalUploadFailureStore } from './upload-failures'

type Check = { name: string; status: 'pass'; evidence: Record<string, unknown> }

/** Real authenticated HTTP requests; faults are injected only at explicit request/response boundaries. */
export async function runCloudUploadChecks(
  config: CollaborationRemoteConfig,
  alice: CollaborationConnection,
  bob: CollaborationConnection,
  aliceDatabase: CollaborationDatabase,
  bobDatabase: CollaborationDatabase,
  groupId: string,
  originalTaskId: string,
  recordCleanup: (id: string) => void
): Promise<Check[]> {
  const aliceId = await alice.connector.getUserId(),
    bobId = await bob.connector.getUserId()
  const checks: Check[] = []
  const tasks = new CollaborationTasksRepository(aliceDatabase.drizzle)
  const bobTasks = new CollaborationTasksRepository(bobDatabase.drizzle)
  const failures = new LocalUploadFailureStore(aliceDatabase.powerSync, aliceId)
  let loseReply: string | null = null,
    failBefore: string | null = null
  const faultClient = createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (input, init) => {
        const url =
          typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
        const body =
          url.includes('/rpc/upload_group_task') && init?.body
            ? (JSON.parse(String(init.body)) as { p_task_id: string })
            : null
        if (body?.p_task_id === failBefore) {
          failBefore = null
          return new Response('{"code":"503","message":"Injected temporary outage"}', {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          })
        }
        const response = await fetch(input, init)
        if (body?.p_task_id === loseReply && response.ok) {
          const result = (await response.clone().json()) as { outcome: string }
          assert.equal(
            result.outcome,
            'accepted',
            'Inject response loss only after a committed acceptance'
          )
          loseReply = null
          throw new TypeError('Injected response loss after remote commit')
        }
        return response
      }
    }
  })
  const { data: session } = await alice.supabase.auth.getSession()
  assert.ok(session.session)
  const { error: sessionError } = await faultClient.auth.setSession(session.session)
  assert.equal(sessionError, null)
  const uploader = new SupabaseCollaborationConnector(config.powerSyncEndpoint, faultClient, {
    userId: aliceId
  })
  const drain = async (): Promise<void> => {
    for (let i = 0; (await aliceDatabase.powerSync.getUploadQueueStats()).count; i++) {
      assert.ok(i < 50, 'Bounded cloud queue drain')
      await uploader.uploadData(aliceDatabase.powerSync)
    }
  }
  const remote = async (id: string): Promise<Record<string, unknown> | null> => {
    const { data, error } = await bob.supabase
      .from('group_tasks')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    assert.equal(error, null)
    return data
  }
  const bobEdit = async (id: string, title: string): Promise<Record<string, unknown>> => {
    const { data, error } = await bob.supabase
      .from('group_tasks')
      .update({ title })
      .eq('id', id)
      .select('*')
      .single()
    assert.equal(error, null)
    assert.ok(data)
    return data
  }
  const wait = async (predicate: () => Promise<boolean>): Promise<void> => {
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      if (await predicate()) return
      await new Promise((resolve) => setTimeout(resolve, 250))
    }
    throw new Error('Cloud hardening convergence timed out')
  }
  await aliceDatabase.powerSync.disconnect()
  const { error: deletedError } = await bob.supabase
    .from('group_tasks')
    .delete()
    .eq('id', originalTaskId)
  assert.equal(deletedError, null)
  await tasks.update(originalTaskId, groupId, aliceId, { description: 'Preserve this stale edit' })
  await drain()
  const stale = (await failures.list()).find((f) => f.taskId === originalTaskId)
  assert.equal(stale?.reason, 'MISSING_OR_INACCESSIBLE')
  assert.equal(stale?.changes.description, 'Preserve this stale edit')
  checks.push({
    name: 'Z1: deleted task PATCH is preserved before queue retirement',
    status: 'pass',
    evidence: { rejected: 1, pending: 0, remoteTaskAbsent: (await remote(originalTaskId)) === null }
  })

  const privateGroup = await new SupabaseCollaborationGateway(bob.supabase, () => true).createGroup(
    `Upload denial probe ${crypto.randomUUID().slice(0, 8)}`
  )
  recordCleanup(privateGroup.id)
  const hiddenId = crypto.randomUUID()
  const { error: hiddenError } = await bob.supabase.from('group_tasks').insert({
    id: hiddenId,
    group_id: privateGroup.id,
    title: 'Bob private task',
    created_by: bobId
  })
  assert.equal(hiddenError, null)
  // Seed only the known disposable task ID locally; acknowledge fixture, then generate a real PATCH.
  await aliceDatabase.powerSync.execute(
    'INSERT INTO group_tasks (id, group_id, title, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      hiddenId,
      privateGroup.id,
      'Known fixture',
      'open',
      aliceId,
      new Date().toISOString(),
      new Date().toISOString()
    ]
  )
  await (await aliceDatabase.powerSync.getNextCrudTransaction())?.complete()
  await tasks.update(hiddenId, privateGroup.id, aliceId, { title: 'Unauthorized edit' })
  const denied = await tasks.create({
    groupId: privateGroup.id,
    actorId: aliceId,
    title: 'Rejected creation'
  })
  const valid = await tasks.create({
    groupId,
    actorId: aliceId,
    title: 'Valid after rejected creation'
  })
  await drain()
  const rejected = await failures.list()
  assert.equal(rejected.find((f) => f.taskId === hiddenId)?.reason, 'MISSING_OR_INACCESSIBLE')
  assert.ok(rejected.find((f) => f.taskId === denied.id))
  assert.equal((await remote(hiddenId))?.title, 'Bob private task')
  assert.equal((await remote(valid.id))?.title, 'Valid after rejected creation')
  const { data: hiddenRead, error: hiddenReadError } = await alice.supabase
    .from('group_tasks')
    .select('*')
    .eq('id', hiddenId)
  assert.equal(hiddenReadError, null)
  assert.deepEqual(hiddenRead, [])
  await wait(
    async () =>
      (await bobTasks.findByIdAndGroupId(valid.id, groupId))?.title ===
      'Valid after rejected creation'
  )
  checks.push({
    name: 'Z2/Q1: RLS-hidden edits rejected; unrelated task reaches Bob',
    status: 'pass',
    evidence: {
      rejected: rejected.length,
      pending: 0,
      hiddenDataReturned: false,
      unrelatedTaskConverged: true,
      cleanupGroupId: privateGroup.id
    }
  })

  const a = crypto.randomUUID(),
    b = crypto.randomUUID()
  await aliceDatabase.powerSync.writeTransaction(async (tx) => {
    for (const [id, title] of [
      [a, 'Alice original'],
      [b, 'Second task']
    ])
      await tx.execute(
        'INSERT INTO group_tasks (id, group_id, title, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, groupId, title, 'open', aliceId, new Date().toISOString(), new Date().toISOString()]
      )
  })
  assert.equal((await aliceDatabase.powerSync.getNextCrudTransaction())?.crud.length, 2)
  failBefore = b
  await assert.rejects(drain())
  const newerA = await bobEdit(a, 'Bob after partial transaction')
  await drain()
  assert.deepEqual(
    await remote(a),
    newerA,
    'Retry must preserve every remote column, including audit time'
  )
  assert.equal((await remote(b))?.title, 'Second task')
  checks.push({
    name: 'R1: partial transaction replay preserves Bob’s complete row',
    status: 'pass',
    evidence: { transactionOperations: 2, newerRowUnchanged: true, pending: 0 }
  })

  const lost = await tasks.create({ groupId, actorId: aliceId, title: 'Lost PUT reply' })
  loseReply = lost.id
  await assert.rejects(drain())
  const afterPut = await bobEdit(lost.id, 'Bob after lost PUT reply')
  await drain()
  assert.deepEqual(await remote(lost.id), afterPut)
  await wait(
    async () =>
      (await bobTasks.findByIdAndGroupId(lost.id, groupId))?.title === 'Bob after lost PUT reply'
  )
  await tasks.update(lost.id, groupId, aliceId, { title: 'Lost PATCH reply' })
  loseReply = lost.id
  await assert.rejects(drain())
  const afterPatch = await bobEdit(lost.id, 'Bob after lost PATCH reply')
  await drain()
  assert.deepEqual(await remote(lost.id), afterPatch)
  await aliceDatabase.powerSync.connect(alice.connector)
  await wait(async () => {
    const rows = await Promise.all([
      tasks.findByIdAndGroupId(lost.id, groupId),
      bobTasks.findByIdAndGroupId(lost.id, groupId)
    ])
    return rows.every((row) => row?.title === 'Bob after lost PATCH reply')
  })
  await aliceDatabase.powerSync.disconnect()
  checks.push({
    name: 'R2/R3: lost PUT and PATCH replies cannot overwrite Bob’s subsequent edits',
    status: 'pass',
    evidence: { newerRowsUnchanged: true, replicasConverged: true, pending: 0 }
  })
  await tasks.delete(lost.id, groupId)
  loseReply = lost.id
  await assert.rejects(drain())
  await drain()
  assert.equal(await remote(lost.id), null)
  const { data: absentDelete, error: absentError } = await alice.supabase.rpc('upload_group_task', {
    p_replica_id: crypto.randomUUID(),
    p_operation_id: '1',
    p_task_id: lost.id,
    p_operation: 'DELETE',
    p_data: {}
  })
  assert.equal(absentError, null)
  assert.equal(absentDelete.outcome, 'accepted')
  checks.push({
    name: 'R4/Z4: lost DELETE reply and absent target remain safe no-ops',
    status: 'pass',
    evidence: { remoteTaskAbsent: true, pending: 0 }
  })

  const concurrentId = crypto.randomUUID()
  const parameters = {
    p_replica_id: crypto.randomUUID(),
    p_operation_id: '1',
    p_task_id: concurrentId,
    p_operation: 'PUT',
    p_data: { group_id: groupId, title: 'Concurrent duplicate', created_by: aliceId }
  }
  const responses = await Promise.all([
    alice.supabase.rpc('upload_group_task', parameters),
    alice.supabase.rpc('upload_group_task', parameters)
  ])
  for (const response of responses) assert.equal(response.error, null)
  assert.deepEqual(responses.map((response) => response.data.outcome).sort(), [
    'accepted',
    'already_applied'
  ])
  const beforeReplay = await bobEdit(concurrentId, 'Bob after concurrent duplicates')
  const replay = await alice.supabase.rpc('upload_group_task', parameters)
  assert.equal(replay.error, null)
  assert.equal(replay.data.outcome, 'already_applied')
  assert.deepEqual(await remote(concurrentId), beforeReplay)
  checks.push({
    name: 'backend: concurrent duplicate requests serialize and apply once',
    status: 'pass',
    evidence: { outcomes: ['accepted', 'already_applied'], newerRowUnchanged: true }
  })

  await aliceDatabase.powerSync.connect(alice.connector)
  await wait(async () => {
    const rows = await Promise.all([
      tasks.findByIdAndGroupId(a, groupId),
      bobTasks.findByIdAndGroupId(a, groupId)
    ])
    return (
      rows.every((row) => row?.title === 'Bob after partial transaction') &&
      !(await bobTasks.findByIdAndGroupId(lost.id, groupId))
    )
  })
  assert.equal((await failures.list()).length, 3)
  assert.equal((await aliceDatabase.powerSync.getUploadQueueStats()).count, 0)
  checks.push({
    name: 'cloud recovery: both replicas converge and rejected drafts remain inspectable',
    status: 'pass',
    evidence: { rejected: 3, pending: 0, replicasConverged: true }
  })
  return checks
}
