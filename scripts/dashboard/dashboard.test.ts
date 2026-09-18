import assert from 'node:assert/strict'
import test from 'node:test'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import {
  createApiClient,
  type ApiInput,
  type ApiOperationId,
  type ApiOutput,
  type ApiResult,
  type ApiTransport
} from '../../src/shared/api'
import { SessionService } from '../../src/main/auth/session.service'
import * as schema from '../../src/main/db/schema'
import { createApiDispatcher } from '../../src/main/ipc/api-dispatcher'
import { createDashboardHandlers } from '../../src/main/ipc/handlers/dashboard.handlers'
import { ActivityLogRepository } from '../../src/main/repositories/activity-log.repository'
import { EventsRepository } from '../../src/main/repositories/events.repository'
import { GradesRepository } from '../../src/main/repositories/grades.repository'
import { DashboardService } from '../../src/main/services/dashboard.service'

const NOW = new Date('2026-09-18T10:00:00.000Z')
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

interface TestContext {
  client: Client
  session: SessionService
  api: ReturnType<typeof createApiClient>
  dispatch: ReturnType<typeof createApiDispatcher>
}

async function createTestContext(): Promise<TestContext> {
  const client = createClient({ url: 'file::memory:' })
  await client.batch(
    [
      `CREATE TABLE grades (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        grade REAL,
        ects REAL NOT NULL,
        semester TEXT NOT NULL,
        passed INTEGER NOT NULL DEFAULT 0,
        notes TEXT,
        user_id INTEGER NOT NULL,
        course_id INTEGER,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        start_date INTEGER NOT NULL,
        end_date INTEGER NOT NULL,
        type TEXT NOT NULL DEFAULT 'other',
        importance TEXT NOT NULL DEFAULT 'medium',
        is_multi_day INTEGER NOT NULL DEFAULT 0,
        location TEXT,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch()),
        updated_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `CREATE TABLE activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`
    ],
    'write'
  )

  const database = drizzle(client, { schema })
  const session = new SessionService()
  const service = new DashboardService(
    new GradesRepository(database),
    new EventsRepository(database),
    new ActivityLogRepository(database),
    () => new Date(NOW)
  )
  const dispatch = createApiDispatcher({
    handlers: createDashboardHandlers(service, session),
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

  return { client, session, api: createApiClient(transport), dispatch }
}

async function insertEvent(
  client: Client,
  title: string,
  startDate: Date,
  type: string,
  userId = 7
): Promise<void> {
  await client.execute({
    sql: `INSERT INTO events
      (title, start_date, end_date, type, importance, is_multi_day, user_id)
      VALUES (?, ?, ?, ?, 'medium', 0, ?)`,
    args: [
      title,
      Math.floor(startDate.getTime() / 1000),
      Math.floor((startDate.getTime() + 60 * 60 * 1000) / 1000),
      type,
      userId
    ]
  })
}

test('protects every dashboard operation with the current session', async () => {
  const context = await createTestContext()
  try {
    for (const operationId of [
      'getDashboardStats',
      'getDashboardUpcoming',
      'getDashboardActivity'
    ] as const) {
      const result = await context.dispatch({} as never, {
        operationId,
        input: {},
        requestId: `unauthenticated-${operationId}`
      })
      assert.equal(result.ok, false)
      if (!result.ok) assert.equal(result.error.code, 'UNAUTHENTICATED')
    }
  } finally {
    context.client.close()
  }
})

test('returns valid empty dashboard data for a user without records', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    assert.deepEqual(await context.api.dashboard.getDashboardStats(), {
      gpa: null,
      totalEcts: 0,
      upcomingDeadlinesCount: 0,
      gradesCount: 0
    })
    assert.deepEqual(await context.api.dashboard.getDashboardUpcoming(), [])
    assert.deepEqual(await context.api.dashboard.getDashboardActivity(), [])
  } finally {
    context.client.close()
  }
})

test('calculates personal statistics and counts only upcoming deadline event types', async () => {
  const context = await createTestContext()
  try {
    await context.client.batch(
      [
        `INSERT INTO grades (course_name, grade, ects, semester, passed, user_id)
         VALUES ('Algorithms', 1.0, 5, 'WS 2026', 1, 7)`,
        `INSERT INTO grades (course_name, grade, ects, semester, passed, user_id)
         VALUES ('Databases', 3.0, 5, 'WS 2026', 0, 7)`,
        `INSERT INTO grades (course_name, grade, ects, semester, passed, user_id)
         VALUES ('Project', NULL, 4, 'WS 2026', 1, 7)`,
        `INSERT INTO grades (course_name, grade, ects, semester, passed, user_id)
         VALUES ('Private', 1.0, 30, 'WS 2026', 1, 8)`
      ],
      'write'
    )

    await insertEvent(context.client, 'Past deadline', new Date(NOW.getTime() - 1000), 'deadline')
    await insertEvent(context.client, 'Exam now', NOW, 'exam')
    await insertEvent(
      context.client,
      'Lecture tomorrow',
      new Date(NOW.getTime() + 24 * 60 * 60 * 1000),
      'lecture'
    )
    await insertEvent(
      context.client,
      'Other appointment',
      new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000),
      'other'
    )
    await insertEvent(
      context.client,
      'Private deadline',
      new Date(NOW.getTime() + 3 * 24 * 60 * 60 * 1000),
      'deadline',
      8
    )
    await insertEvent(
      context.client,
      'Registration boundary',
      new Date(NOW.getTime() + SEVEN_DAYS_MS),
      'registration'
    )
    await insertEvent(
      context.client,
      'Late deadline',
      new Date(NOW.getTime() + SEVEN_DAYS_MS + 1000),
      'deadline'
    )

    context.session.start(7)
    assert.deepEqual(await context.api.dashboard.getDashboardStats(), {
      gpa: 2,
      totalEcts: 9,
      upcomingDeadlinesCount: 2,
      gradesCount: 3
    })
    assert.deepEqual(
      (await context.api.dashboard.getDashboardUpcoming()).map(({ title }) => title),
      ['Exam now', 'Lecture tomorrow', 'Other appointment', 'Registration boundary']
    )
  } finally {
    context.client.close()
  }
})

test('returns only the current user ten newest activity records', async () => {
  const context = await createTestContext()
  try {
    const statements = Array.from({ length: 12 }, (_, index) => {
      const activityNumber = index + 1
      return `INSERT INTO activity_log (type, description, user_id, created_at)
        VALUES ('grade_added', 'Activity ${activityNumber}', 7, ${activityNumber})`
    })
    statements.push(
      `INSERT INTO activity_log (type, description, user_id, created_at)
       VALUES ('event_added', 'Private activity', 8, 999)`
    )
    await context.client.batch(statements, 'write')

    context.session.start(7)
    const activity = await context.api.dashboard.getDashboardActivity()
    assert.equal(activity.length, 10)
    assert.deepEqual(
      activity.map(({ description }) => description),
      Array.from({ length: 10 }, (_, index) => `Activity ${12 - index}`)
    )
    assert.equal(
      activity.every((item) => !Object.hasOwn(item, 'userId')),
      true
    )
    assert.equal(
      activity.every((item) => item.createdAt instanceof Date),
      true
    )
  } finally {
    context.client.close()
  }
})
