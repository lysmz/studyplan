import assert from 'node:assert/strict'
import test from 'node:test'
import { SupabaseCollaborationConnector } from '../../src/main/collaboration/connector'
import {
  aliceId,
  MemoryFailures,
  MemoryQueue,
  put,
  ScriptedBackend
} from './helpers/scripted-backend'

interface Fixture {
  backend: ScriptedBackend
  failures: MemoryFailures
  queue: MemoryQueue
  connector: SupabaseCollaborationConnector
  upload: () => Promise<void>
}

function fixture(entries: ConstructorParameters<typeof MemoryQueue>[0]): Fixture {
  const backend = new ScriptedBackend()
  const failures = new MemoryFailures()
  const queue = new MemoryQueue(entries)
  const connector = new SupabaseCollaborationConnector(
    'https://synthetic.powersync.test',
    backend.client(),
    { userId: aliceId, failureStore: failures }
  )
  const upload = async (): Promise<void> => {
    while (queue.entries.length) await connector.uploadData(queue.database())
  }
  return { backend, failures, queue, connector, upload }
}

test('R5: the same queue sequence on different replicas represents different operations', async () => {
  const backend = new ScriptedBackend(),
    failures = new MemoryFailures()
  const first = new MemoryQueue([put('first', 1)])
  const second = new MemoryQueue([put('second', 1)], '99999999-9999-4999-8999-999999999999')
  const connector = new SupabaseCollaborationConnector(
    'https://synthetic.powersync.test',
    backend.client(),
    { userId: aliceId, failureStore: failures }
  )
  await connector.uploadData(first.database())
  await connector.uploadData(second.database())
  assert.equal(backend.rows.size, 2)
  assert.equal(backend.receipts.size, 2)
  assert.equal(failures.records.size, 0)
})

test('Z3/Z4: ordinary updates and absent deletes complete without failure records', async () => {
  const f = fixture([
    { ...put('a'), op: 'PATCH', opData: { description: null, status: 'done' } },
    { ...put('absent', 2), op: 'DELETE', opData: undefined }
  ])
  f.backend.rows.set('a', { title: 'Unchanged', description: 'Clear me' })
  await f.upload()
  assert.deepEqual(f.backend.rows.get('a'), {
    title: 'Unchanged',
    description: null,
    status: 'done'
  })
  assert.equal(f.failures.records.size, 0)
})

test('Q2: temporary failure retains intent until recovery', async () => {
  const f = fixture([put('a')])
  f.backend.failOnce = 'a'
  await assert.rejects(f.upload())
  assert.equal(f.queue.entries.length, 1)
  assert.equal(f.failures.records.size, 0)
  await f.upload()
  assert.equal(f.backend.rows.get('a')?.title, 'Alice original')
})

for (const response of [
  { status: 401, body: { code: 'PGRST301', message: 'Expired authentication' } },
  { status: 400, body: { code: 'UNKNOWN', message: 'Unrecognized server error' } },
  { status: 200, body: null },
  { status: 200, body: { outcome: 'rejected', code: 'UNKNOWN' } }
])
  test('Q3: auth, unknown or malformed outcomes preserve the queue', async () => {
    const f = fixture([put('a')])
    f.backend.responseOverride = response
    await assert.rejects(f.upload())
    assert.equal(f.queue.entries.length, 1)
    assert.equal(f.failures.records.size, 0)
  })

test('Q4/Q5: journal and acknowledgement failures recover without duplicate records', async () => {
  const f = fixture([put('denied'), put('b', 2)])
  f.backend.denied.add('denied')
  f.failures.failSave = true
  await assert.rejects(f.upload(), /Journal/)
  assert.equal(f.queue.entries.length, 2)
  f.failures.failSave = false
  f.queue.failAck = true
  await assert.rejects(f.upload(), /Acknowledgement/)
  assert.equal(f.failures.records.size, 1)
  f.queue.failAck = false
  await f.upload()
  assert.equal(f.failures.records.size, 1)
  assert.ok(f.backend.rows.has('b'))
})

test('Q6: dependent changes are preserved after a rejected creation', async () => {
  const f = fixture([
    put('denied'),
    { ...put('denied', 2), op: 'PATCH', opData: { title: 'Later intent' } },
    { ...put('denied', 3), op: 'DELETE', opData: undefined },
    put('b', 4)
  ])
  f.backend.denied.add('denied')
  await f.upload()
  assert.deepEqual(
    [...f.failures.records.values()].map((r) => r.reason),
    ['MISSING_OR_INACCESSIBLE', 'DEPENDENCY_REJECTED', 'DEPENDENCY_REJECTED']
  )
  assert.equal([...f.failures.records.values()][1].changes.title, 'Later intent')
  assert.ok(f.backend.rows.has('b'))
})

test('Q8: forbidden table write is surfaced without contacting the backend', async () => {
  const f = fixture([{ ...put('a'), table: 'study_groups' }])
  await assert.rejects(f.upload(), /server-managed/)
  assert.equal(f.backend.requests, 0)
  assert.equal(f.queue.entries.length, 1)
})

test('R4: lost DELETE response is safely replayed', async () => {
  const f = fixture([{ ...put('a'), op: 'DELETE', opData: undefined }])
  f.backend.rows.set('a', { title: 'Delete me' })
  f.backend.loseResponseOnce = 'a'
  await assert.rejects(f.upload())
  await f.upload()
  assert.equal(f.backend.rows.has('a'), false)
  assert.equal(f.backend.mutations, 1)
})

test('R6: changed operation payload and colliding task identities are rejected', async () => {
  const f = fixture([put('a')])
  f.queue.failAck = true
  await assert.rejects(f.upload())
  f.queue.entries[0].opData!.title = 'Different payload'
  f.queue.failAck = false
  await f.upload()
  assert.equal(f.backend.rows.get('a')?.title, 'Alice original')
  assert.equal([...f.failures.records.values()][0].reason, 'OPERATION_CONFLICT')
  const g = fixture([put('existing')])
  g.backend.rows.set('existing', { title: 'Other creation' })
  await g.upload()
  assert.equal(g.backend.rows.get('existing')?.title, 'Other creation')
  assert.equal([...g.failures.records.values()][0].reason, 'TASK_CONFLICT')
})

test('Z1: a zero-row PATCH preserves the intended edit before retirement', async () => {
  const f = fixture([{ ...put('missing'), op: 'PATCH', opData: { title: 'Preserve this edit' } }])
  f.queue.onComplete = () =>
    assert.equal(f.failures.records.size, 1, 'rejection must be durable before acknowledgement')
  await f.upload()
  assert.equal(f.failures.records.size, 1)
})

test('Q1: permanent rejection preserves A and allows unrelated B to upload', async () => {
  const f = fixture([put('denied'), put('valid', 2)])
  f.backend.denied.add('denied')
  await f.upload().catch(() => undefined)
  assert.equal(f.backend.rows.get('valid')?.title, 'Alice original', 'valid writes must progress')
  assert.equal(f.failures.records.size, 1)
  assert.equal(f.queue.entries.length, 0)
})

test('R1: replay after a later failure preserves another member edit', async () => {
  const f = fixture([
    { ...put('a'), transactionId: 1 },
    { ...put('b', 2), transactionId: 1 }
  ])
  f.backend.failOnce = 'b'
  await assert.rejects(f.upload())
  f.backend.rows.set('a', { ...f.backend.rows.get('a'), title: 'Bob newer edit' })
  await f.upload()
  assert.equal(f.backend.rows.get('a')?.title, 'Bob newer edit')
})

for (const op of ['PUT', 'PATCH'] as const) {
  test(`R2/R3: a lost ${op} response cannot overwrite a subsequent edit`, async () => {
    const f = fixture([
      { ...put('a'), op, opData: op === 'PUT' ? put('a').opData : { title: 'Alice edit' } }
    ])
    if (op === 'PATCH') f.backend.rows.set('a', { title: 'Initial' })
    f.backend.loseResponseOnce = 'a'
    await assert.rejects(f.upload())
    f.backend.rows.set('a', { ...f.backend.rows.get('a'), title: 'Bob later edit' })
    await f.upload()
    assert.equal(f.backend.rows.get('a')?.title, 'Bob later edit')
  })
}
