import assert from 'node:assert/strict'
import test from 'node:test'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import {
  ApiClientError,
  createApiClient,
  type ApiInput,
  type ApiOperationId,
  type ApiOutput,
  type ApiResult,
  type ApiTransport
} from '../../src/shared/api'
import * as schema from '../../src/main/db/schema'
import { SessionService } from '../../src/main/auth/session.service'
import { createApiDispatcher } from '../../src/main/ipc/api-dispatcher'
import { createGroupHandlers } from '../../src/main/ipc/handlers/groups.handlers'
import { GroupsRepository } from '../../src/main/repositories/groups.repository'
import { GroupsService } from '../../src/main/services/groups.service'

interface TestContext {
  client: Client
  repository: GroupsRepository
  session: SessionService
  api: ReturnType<typeof createApiClient>
  dispatch: ReturnType<typeof createApiDispatcher>
}

const createGroupsTable = `CREATE TABLE study_groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_by INTEGER NOT NULL,
  invite_token TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
)`

async function createTestContext(): Promise<TestContext> {
  const client = createClient({ url: 'file::memory:' })
  await client.batch(
    [
      createGroupsTable,
      `CREATE TABLE group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE group_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL
      )`,
      `CREATE TABLE group_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL
      )`,
      `CREATE TABLE group_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL
      )`,
      `CREATE TABLE group_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL
      )`,
      `CREATE TABLE group_activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL
      )`,
      `INSERT INTO study_groups (id, name, description, created_by, invite_token, created_at) VALUES
        (1, 'Older Group', 'First', 1, 'older-token', 100),
        (2, 'Other Group', NULL, 2, 'other-token', 200),
        (3, 'Recent Group', 'Latest', 1, 'recent-token', 300)`,
      `INSERT INTO group_members (group_id, user_id, role, joined_at) VALUES
        (1, 1, 'owner', 100),
        (1, 2, 'member', 101),
        (2, 2, 'owner', 200),
        (3, 1, 'owner', 300)`
    ],
    'write'
  )

  const database = drizzle(client, { schema })
  const repository = new GroupsRepository(database)
  const service = new GroupsService(repository)
  const session = new SessionService()
  const dispatch = createApiDispatcher({
    handlers: createGroupHandlers(service, session),
    isSenderAllowed: () => true
  })
  const transport: ApiTransport = async <K extends ApiOperationId>(
    operationId: K,
    input: ApiInput<K>
  ): Promise<ApiResult<ApiOutput<K>>> =>
    (await dispatch({} as never, {
      operationId,
      input,
      requestId: `test-${operationId}`
    })) as ApiResult<ApiOutput<K>>

  return { client, repository, session, api: createApiClient(transport), dispatch }
}

test('all group foundation operations require a session', async () => {
  const context = await createTestContext()
  try {
    const calls = [
      () => context.api.groups.listGroups(),
      () => context.api.groups.createGroup({ body: { name: 'New Group' } }),
      () => context.api.groups.getGroup({ path: { id: 1 } }),
      () => context.api.groups.updateGroup({ path: { id: 1 }, body: { name: 'Renamed' } }),
      () => context.api.groups.deleteGroup({ path: { id: 1 } })
    ]
    for (const call of calls) {
      await assert.rejects(
        call,
        (error: unknown) => error instanceof ApiClientError && error.code === 'UNAUTHENTICATED'
      )
    }
  } finally {
    context.client.close()
  }
})

test('lists only memberships in newest-first order with roles and member counts', async () => {
  const context = await createTestContext()
  try {
    context.session.start(1)
    const groups = await context.api.groups.listGroups()
    assert.deepEqual(
      groups.map(({ id, myRole, memberCount }) => ({ id, myRole, memberCount })),
      [
        { id: 3, myRole: 'owner', memberCount: 1 },
        { id: 1, myRole: 'owner', memberCount: 2 }
      ]
    )
  } finally {
    context.client.close()
  }
})

test('creates a group and its owner membership atomically', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    const group = await context.api.groups.createGroup({
      body: { name: 'Created Group', description: 'Together' }
    })
    assert.equal(group.name, 'Created Group')
    assert.equal(group.description, 'Together')
    assert.equal(group.createdBy, 7)
    assert.equal(group.myRole, 'owner')
    assert.equal(group.memberCount, 1)
    assert.ok(group.inviteToken)

    assert.deepEqual(await context.api.groups.listGroups(), [group])
  } finally {
    context.client.close()
  }
})

test('rolls back group creation when the owner membership cannot be inserted', async () => {
  const client = createClient({ url: 'file::memory:' })
  try {
    await client.batch(
      [
        createGroupsTable,
        `CREATE TABLE group_members (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          group_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          role TEXT NOT NULL CHECK (role = 'member'),
          joined_at INTEGER NOT NULL DEFAULT (unixepoch())
        )`
      ],
      'write'
    )
    const repository = new GroupsRepository(drizzle(client, { schema }))
    await assert.rejects(() =>
      repository.createWithOwner({ name: 'Rolled Back', description: null, createdBy: 1 }, 1)
    )
    const result = await client.execute('SELECT COUNT(*) AS count FROM study_groups')
    assert.equal(Number(result.rows[0].count), 0)
  } finally {
    client.close()
  }
})

test('returns group summaries to members and hides missing or inaccessible groups', async () => {
  const context = await createTestContext()
  try {
    context.session.start(2)
    const group = await context.api.groups.getGroup({ path: { id: 1 } })
    assert.equal(group.myRole, 'member')
    assert.equal(group.memberCount, 2)

    for (const id of [3, 999]) {
      await assert.rejects(
        () => context.api.groups.getGroup({ path: { id } }),
        (error: unknown) =>
          error instanceof ApiClientError &&
          error.code === 'NOT_FOUND' &&
          (error.details as { status?: number })?.status === 404
      )
    }
  } finally {
    context.client.close()
  }
})

test('allows owner updates, including null descriptions and empty no-op updates', async () => {
  const context = await createTestContext()
  try {
    context.session.start(1)
    const updated = await context.api.groups.updateGroup({
      path: { id: 1 },
      body: { name: 'Renamed Group', description: null }
    })
    assert.equal(updated.name, 'Renamed Group')
    assert.equal(updated.description, null)
    assert.equal(updated.myRole, 'owner')
    assert.equal(updated.memberCount, 2)

    assert.deepEqual(await context.api.groups.updateGroup({ path: { id: 1 }, body: {} }), updated)
  } finally {
    context.client.close()
  }
})

test('returns forbidden for members and not found for non-members updating a group', async () => {
  const context = await createTestContext()
  try {
    context.session.start(2)
    await assert.rejects(
      () => context.api.groups.updateGroup({ path: { id: 1 }, body: { name: 'Denied' } }),
      (error: unknown) =>
        error instanceof ApiClientError &&
        error.code === 'FORBIDDEN' &&
        (error.details as { status?: number })?.status === 403
    )

    context.session.start(9)
    await assert.rejects(
      () => context.api.groups.updateGroup({ path: { id: 1 }, body: { name: 'Hidden' } }),
      (error: unknown) =>
        error instanceof ApiClientError &&
        error.code === 'NOT_FOUND' &&
        (error.details as { status?: number })?.status === 404
    )
  } finally {
    context.client.close()
  }
})

test('lets an owner delete the complete group aggregate without affecting other groups', async () => {
  const context = await createTestContext()
  try {
    await context.client.batch(
      [
        'INSERT INTO group_events (group_id) VALUES (1), (2)',
        'INSERT INTO group_tasks (group_id) VALUES (1), (2)',
        'INSERT INTO group_notes (group_id) VALUES (1), (2)',
        'INSERT INTO group_comments (group_id) VALUES (1), (2)',
        'INSERT INTO group_activity_log (group_id) VALUES (1), (2)'
      ],
      'write'
    )

    context.session.start(1)
    assert.equal(await context.api.groups.deleteGroup({ path: { id: 1 } }), undefined)

    for (const table of [
      'study_groups',
      'group_members',
      'group_events',
      'group_tasks',
      'group_notes',
      'group_comments',
      'group_activity_log'
    ]) {
      const deleted = await context.client.execute(
        `SELECT COUNT(*) AS count FROM ${table} WHERE ${
          table === 'study_groups' ? 'id' : 'group_id'
        } = 1`
      )
      const retained = await context.client.execute(
        `SELECT COUNT(*) AS count FROM ${table} WHERE ${
          table === 'study_groups' ? 'id' : 'group_id'
        } = 2`
      )
      assert.equal(Number(deleted.rows[0].count), 0, `${table} retained deleted group data`)
      assert.ok(Number(retained.rows[0].count) > 0, `${table} removed another group's data`)
    }
  } finally {
    context.client.close()
  }
})

test('rejects group deletion by members and hides groups from non-members', async () => {
  const context = await createTestContext()
  try {
    context.session.start(2)
    await assert.rejects(
      () => context.api.groups.deleteGroup({ path: { id: 1 } }),
      (error: unknown) =>
        error instanceof ApiClientError &&
        error.code === 'FORBIDDEN' &&
        (error.details as { status?: number })?.status === 403
    )

    context.session.start(9)
    for (const id of [1, 999]) {
      await assert.rejects(
        () => context.api.groups.deleteGroup({ path: { id } }),
        (error: unknown) =>
          error instanceof ApiClientError &&
          error.code === 'NOT_FOUND' &&
          (error.details as { status?: number })?.status === 404
      )
    }

    const group = await context.client.execute('SELECT id FROM study_groups WHERE id = 1')
    assert.equal(group.rows.length, 1)
  } finally {
    context.client.close()
  }
})

test('rolls back every aggregate deletion when a child delete fails', async () => {
  const context = await createTestContext()
  try {
    await context.client.batch(
      [
        'INSERT INTO group_comments (group_id) VALUES (1)',
        'INSERT INTO group_activity_log (group_id) VALUES (1)',
        'INSERT INTO group_events (group_id) VALUES (1)',
        'INSERT INTO group_tasks (group_id) VALUES (1)',
        `CREATE TRIGGER reject_group_task_delete
          BEFORE DELETE ON group_tasks
          WHEN OLD.group_id = 1
          BEGIN
            SELECT RAISE(ABORT, 'blocked task deletion');
          END`
      ],
      'write'
    )

    context.session.start(1)
    await assert.rejects(
      () => context.api.groups.deleteGroup({ path: { id: 1 } }),
      (error: unknown) => error instanceof ApiClientError && error.code === 'INTERNAL_ERROR'
    )

    for (const table of [
      'study_groups',
      'group_members',
      'group_events',
      'group_tasks',
      'group_comments',
      'group_activity_log'
    ]) {
      const result = await context.client.execute(
        `SELECT COUNT(*) AS count FROM ${table} WHERE ${
          table === 'study_groups' ? 'id' : 'group_id'
        } = 1`
      )
      assert.ok(Number(result.rows[0].count) > 0, `${table} was not rolled back`)
    }
  } finally {
    context.client.close()
  }
})

test('rejects malformed group IPC input before invoking a handler', async () => {
  const context = await createTestContext()
  try {
    context.session.start(1)
    const result = await context.dispatch({} as never, {
      operationId: 'updateGroup',
      input: { path: { id: '1' }, body: { name: 'Invalid' } },
      requestId: 'invalid-group-input'
    })
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error.code, 'VALIDATION_ERROR')
  } finally {
    context.client.close()
  }
})
