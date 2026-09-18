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
import { createApiDispatcher, definePartialApiHandlers } from '../../src/main/ipc/api-dispatcher'
import { createGroupCommentsHandlers } from '../../src/main/ipc/handlers/group-comments.handlers'
import { createGroupEventsHandlers } from '../../src/main/ipc/handlers/group-events.handlers'
import { createGroupNotesHandlers } from '../../src/main/ipc/handlers/group-notes.handlers'
import { createGroupTasksHandlers } from '../../src/main/ipc/handlers/group-tasks.handlers'
import { GroupActivityRepository } from '../../src/main/repositories/group-activity.repository'
import { GroupCommentsRepository } from '../../src/main/repositories/group-comments.repository'
import { GroupEventsRepository } from '../../src/main/repositories/group-events.repository'
import { GroupNotesRepository } from '../../src/main/repositories/group-notes.repository'
import { GroupTasksRepository } from '../../src/main/repositories/group-tasks.repository'
import { GroupUnitOfWork } from '../../src/main/repositories/group-transaction'
import { GroupsRepository } from '../../src/main/repositories/groups.repository'
import { GroupAccessService } from '../../src/main/services/group-access.service'
import { GroupCommentsService } from '../../src/main/services/group-comments.service'
import { GroupEventsService } from '../../src/main/services/group-events.service'
import { GroupNotesService } from '../../src/main/services/group-notes.service'
import { GroupTasksService } from '../../src/main/services/group-tasks.service'

interface TestContext {
  client: Client
  session: SessionService
  api: ReturnType<typeof createApiClient>
}

async function createTestContext(): Promise<TestContext> {
  const client = createClient({ url: 'file::memory:' })
  await client.batch(
    [
      `CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        study_program_id INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE study_groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        created_by INTEGER NOT NULL,
        invite_token TEXT NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE group_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE group_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'other',
        location TEXT,
        created_by INTEGER NOT NULL,
        updated_by INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE group_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        due_date INTEGER,
        assignee_id INTEGER,
        status TEXT NOT NULL DEFAULT 'open',
        created_by INTEGER NOT NULL,
        updated_by INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE group_notes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        url TEXT,
        type TEXT NOT NULL DEFAULT 'note',
        created_by INTEGER NOT NULL,
        updated_by INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE group_comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        target_type TEXT NOT NULL,
        target_id INTEGER NOT NULL,
        content TEXT NOT NULL,
        created_by INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE group_activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        group_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        actor_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `INSERT INTO users (id, username, password_hash, display_name) VALUES
        (1, 'owner', 'hash', 'Owner One'),
        (2, 'member', 'hash', 'Member Two'),
        (3, 'other-member', 'hash', 'Member Three'),
        (4, 'outsider', 'hash', 'Outsider Four')`,
      `INSERT INTO study_groups (id, name, created_by, invite_token) VALUES
        (1, 'Main Group', 1, 'main-token'),
        (2, 'Other Group', 4, 'other-token')`,
      `INSERT INTO group_members (group_id, user_id, role) VALUES
        (1, 1, 'owner'),
        (1, 2, 'member'),
        (1, 3, 'member'),
        (2, 4, 'owner')`
    ],
    'write'
  )

  const database = drizzle(client, { schema })
  const groups = new GroupsRepository(database)
  const access = new GroupAccessService(groups)
  const activity = new GroupActivityRepository(database)
  const eventsRepository = new GroupEventsRepository(database)
  const tasksRepository = new GroupTasksRepository(database)
  const notesRepository = new GroupNotesRepository(database)
  const commentsRepository = new GroupCommentsRepository(database)
  const unitOfWork = new GroupUnitOfWork(database)
  const events = new GroupEventsService(access, eventsRepository, activity, unitOfWork)
  const tasks = new GroupTasksService(access, tasksRepository, activity, unitOfWork)
  const notes = new GroupNotesService(access, notesRepository, activity, unitOfWork)
  const comments = new GroupCommentsService(
    access,
    eventsRepository,
    tasksRepository,
    commentsRepository
  )
  const session = new SessionService()
  const dispatch = createApiDispatcher({
    handlers: definePartialApiHandlers({
      ...createGroupEventsHandlers(events, comments, session),
      ...createGroupTasksHandlers(tasks, comments, session),
      ...createGroupNotesHandlers(notes, session),
      ...createGroupCommentsHandlers(comments, session)
    }),
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

  return { client, session, api: createApiClient(transport) }
}

async function expectCode(action: () => Promise<unknown>, code: string): Promise<void> {
  await assert.rejects(
    action,
    (error: unknown) => error instanceof ApiClientError && error.code === code
  )
}

test('child resources require authentication and group membership', async () => {
  const context = await createTestContext()
  try {
    await expectCode(
      () => context.api.groups.listGroupEvents({ path: { id: 1 } }),
      'UNAUTHENTICATED'
    )
    context.session.start(4)
    await expectCode(() => context.api.groups.listGroupEvents({ path: { id: 1 } }), 'FORBIDDEN')
    await expectCode(() => context.api.groups.listGroupTasks({ path: { id: 1 } }), 'FORBIDDEN')
    await expectCode(() => context.api.groups.listGroupNotes({ path: { id: 1 } }), 'FORBIDDEN')
  } finally {
    context.client.close()
  }
})

test('event mutations enrich responses, record activity, and delete comments with the event', async () => {
  const context = await createTestContext()
  try {
    context.session.start(1)
    const event = await context.api.groups.createGroupEvent({
      path: { id: 1 },
      body: {
        title: 'Exam',
        startDate: new Date('2026-10-01T10:00:00Z'),
        endDate: new Date('2026-10-01T12:00:00Z'),
        type: 'exam'
      }
    })
    assert.equal(event.createdByName, 'Owner One')

    const updated = await context.api.groups.updateGroupEvent({
      path: { id: 1, eventId: event.id },
      body: { title: 'Updated Exam' }
    })
    assert.equal(updated.title, 'Updated Exam')

    context.session.start(2)
    await context.api.groups.addEventComment({
      path: { id: 1, eventId: event.id },
      body: { content: 'Ready' }
    })
    assert.equal(
      (await context.api.groups.listEventComments({ path: { id: 1, eventId: event.id } }))[0]
        .createdByName,
      'Member Two'
    )

    context.session.start(1)
    await context.api.groups.deleteGroupEvent({ path: { id: 1, eventId: event.id } })
    const comments = await context.client.execute('SELECT COUNT(*) AS count FROM group_comments')
    assert.equal(Number(comments.rows[0].count), 0)
    const activity = await context.client.execute('SELECT type FROM group_activity_log ORDER BY id')
    assert.deepEqual(
      activity.rows.map(({ type }) => type),
      ['event_created', 'event_updated', 'event_deleted']
    )
  } finally {
    context.client.close()
  }
})

test('tasks validate assignees, expose names, and record completion', async () => {
  const context = await createTestContext()
  try {
    context.session.start(1)
    await expectCode(
      () =>
        context.api.groups.createGroupTask({
          path: { id: 1 },
          body: { title: 'Invalid', assigneeId: 4 }
        }),
      'VALIDATION_ERROR'
    )

    const task = await context.api.groups.createGroupTask({
      path: { id: 1 },
      body: { title: 'Prepare', assigneeId: 2 }
    })
    assert.equal(task.createdByName, 'Owner One')
    assert.equal(task.assigneeName, 'Member Two')

    const completed = await context.api.groups.updateGroupTask({
      path: { id: 1, taskId: task.id },
      body: { status: 'done' }
    })
    assert.equal(completed.status, 'done')
    const activity = await context.client.execute(
      "SELECT COUNT(*) AS count FROM group_activity_log WHERE type = 'task_completed'"
    )
    assert.equal(Number(activity.rows[0].count), 1)
  } finally {
    context.client.close()
  }
})

test('notes preserve ordering and member edits while rejecting cross-group IDs', async () => {
  const context = await createTestContext()
  try {
    context.session.start(2)
    const first = await context.api.groups.createGroupNote({
      path: { id: 1 },
      body: { title: 'First', type: 'note', content: 'Initial' }
    })
    const updated = await context.api.groups.updateGroupNote({
      path: { id: 1, noteId: first.id },
      body: { content: 'Changed' }
    })
    assert.equal(updated.content, 'Changed')
    assert.equal(updated.createdByName, 'Member Two')

    await expectCode(
      () =>
        context.api.groups.updateGroupNote({
          path: { id: 2, noteId: first.id },
          body: { title: 'No' }
        }),
      'FORBIDDEN'
    )
    await context.api.groups.deleteGroupNote({ path: { id: 1, noteId: first.id } })
    assert.deepEqual(await context.api.groups.listGroupNotes({ path: { id: 1 } }), [])
  } finally {
    context.client.close()
  }
})

test('only a comment author or group owner can delete a comment', async () => {
  const context = await createTestContext()
  try {
    context.session.start(1)
    const task = await context.api.groups.createGroupTask({
      path: { id: 1 },
      body: { title: 'Discuss' }
    })
    context.session.start(2)
    const comment = await context.api.groups.addTaskComment({
      path: { id: 1, taskId: task.id },
      body: { content: 'Mine' }
    })

    context.session.start(3)
    await expectCode(
      () => context.api.groups.deleteComment({ path: { id: comment.id } }),
      'FORBIDDEN'
    )
    context.session.start(1)
    await context.api.groups.deleteComment({ path: { id: comment.id } })
    await expectCode(
      () => context.api.groups.deleteComment({ path: { id: comment.id } }),
      'NOT_FOUND'
    )
  } finally {
    context.client.close()
  }
})
