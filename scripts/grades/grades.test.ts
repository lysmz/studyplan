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
import { createGradesHandlers } from '../../src/main/ipc/handlers/grades.handlers'
import { ActivityLogRepository } from '../../src/main/repositories/activity-log.repository'
import { GradesRepository } from '../../src/main/repositories/grades.repository'
import { GradesService } from '../../src/main/services/grades.service'

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
      `CREATE TABLE activity_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        user_id INTEGER NOT NULL,
        created_at INTEGER NOT NULL DEFAULT (unixepoch())
      )`,
      `INSERT INTO grades
        (id, course_name, grade, ects, semester, passed, notes, user_id, course_id, created_at, updated_at)
       VALUES
        (1, 'Algorithms', 1.7, 6, 'WS 2025', 1, NULL, 7, NULL, 100, 100),
        (2, 'Databases', 2.3, 5, 'SS 2026', 1, 'Good', 7, 12, 200, 200),
        (3, 'Private Course', 1.0, 10, 'SS 2026', 1, NULL, 8, NULL, 300, 300)`
    ],
    'write'
  )

  const database = drizzle(client, { schema })
  const service = new GradesService(
    new GradesRepository(database),
    new ActivityLogRepository(database)
  )
  const session = new SessionService()
  const dispatch = createApiDispatcher({
    handlers: createGradesHandlers(service, session),
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

test('protects every grade operation with the current session', async () => {
  const context = await createTestContext()
  try {
    const calls: Array<[ApiOperationId, unknown]> = [
      ['listGrades', {}],
      [
        'createGrade',
        {
          body: {
            courseName: 'Course',
            ects: 5,
            semester: 'WS 2026',
            passed: false
          }
        }
      ],
      ['getGradeStats', {}],
      ['updateGrade', { path: { id: 1 }, body: { grade: 2 } }],
      ['deleteGrade', { path: { id: 1 } }]
    ]

    for (const [operationId, input] of calls) {
      const result = await context.dispatch({} as never, {
        operationId,
        input,
        requestId: `unauthenticated-${operationId}`
      })
      assert.equal(result.ok, false)
      if (!result.ok) assert.equal(result.error.code, 'UNAUTHENTICATED')
    }
  } finally {
    context.client.close()
  }
})

test('lists only the current user grades in newest-first order and filters semesters', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    assert.deepEqual(
      (await context.api.grades.listGrades()).map(({ courseName }) => courseName),
      ['Databases', 'Algorithms']
    )
    assert.deepEqual(
      (await context.api.grades.listGrades({ query: { semester: 'WS 2025' } })).map(
        ({ courseName }) => courseName
      ),
      ['Algorithms']
    )
  } finally {
    context.client.close()
  }
})

test('creates and updates numeric grade values and records activity', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    const created = await context.api.grades.createGrade({
      body: {
        courseName: 'Operating Systems',
        grade: 1.3,
        ects: 4.5,
        semester: 'SS 2026',
        passed: true
      }
    })
    assert.equal(created.grade, 1.3)
    assert.equal(created.ects, 4.5)
    assert.equal(created.notes, null)
    assert.equal(created.courseId, null)
    assert.equal(created.userId, 7)

    const updated = await context.api.grades.updateGrade({
      path: { id: created.id },
      body: { grade: null, notes: 'Retake planned' }
    })
    assert.equal(updated.grade, null)
    assert.equal(updated.notes, 'Retake planned')
    assert.equal(updated.courseName, 'Operating Systems')

    const activity = await context.client.execute(
      'SELECT type, description, user_id FROM activity_log ORDER BY id'
    )
    assert.deepEqual(
      activity.rows.map((row) => [row.type, row.description, Number(row.user_id)]),
      [
        ['grade_added', 'Note für "Operating Systems" hinzugefügt: 1.3', 7],
        ['grade_updated', 'Note für "Operating Systems" aktualisiert', 7]
      ]
    )
  } finally {
    context.client.close()
  }
})

test('calculates overall and per-semester grade statistics', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    const stats = await context.api.grades.getGradeStats()
    assert.equal(stats.overallGpa, 1.97)
    assert.equal(stats.totalEcts, 11)
    assert.deepEqual(stats.bySemester, [
      { semester: 'WS 2025', gpa: 1.7, ects: 6, count: 1 },
      { semester: 'SS 2026', gpa: 2.3, ects: 5, count: 1 }
    ])
  } finally {
    context.client.close()
  }
})

test('enforces ownership for updates and deletes with declared not-found errors', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    for (const action of [
      () => context.api.grades.updateGrade({ path: { id: 3 }, body: { grade: 2 } }),
      () => context.api.grades.deleteGrade({ path: { id: 3 } })
    ]) {
      await assert.rejects(action, (error: unknown) => {
        assert.ok(error instanceof ApiClientError)
        assert.equal(error.code, 'NOT_FOUND')
        assert.deepEqual(error.details, {
          status: 404,
          body: { error: 'Note nicht gefunden' }
        })
        return true
      })
    }

    assert.equal(await context.api.grades.deleteGrade({ path: { id: 1 } }), undefined)
    assert.deepEqual(
      (await context.api.grades.listGrades()).map(({ id }) => id),
      [2]
    )
  } finally {
    context.client.close()
  }
})
