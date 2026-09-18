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
import { createStudyProgramsHandlers } from '../../src/main/ipc/handlers/study-programs.handlers'
import { StudyProgramsRepository } from '../../src/main/repositories/study-programs.repository'
import { StudyProgramsService } from '../../src/main/services/study-programs.service'

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
      `CREATE TABLE study_programs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        faculty TEXT NOT NULL,
        total_ects INTEGER NOT NULL DEFAULT 180
      )`,
      `CREATE TABLE courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        ects REAL NOT NULL,
        semester TEXT NOT NULL,
        study_program_id INTEGER NOT NULL,
        is_required INTEGER NOT NULL DEFAULT 1
      )`,
      `INSERT INTO study_programs (id, name, faculty, total_ects) VALUES
        (1, 'Zoology', 'Science', 180),
        (2, 'Architecture', 'Design', 210)`,
      `INSERT INTO courses (name, ects, semester, study_program_id, is_required) VALUES
        ('Zoology Lab', 5, '2', 1, 1),
        ('Animal Biology', 6, '1', 1, 1),
        ('Cell Biology', 4, '1', 1, 0),
        ('Design Basics', 5, '1', 2, 1)`
    ],
    'write'
  )

  const database = drizzle(client, { schema })
  const repository = new StudyProgramsRepository(database)
  const service = new StudyProgramsService(repository)
  const session = new SessionService()
  const dispatch = createApiDispatcher({
    handlers: createStudyProgramsHandlers(service, session),
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

test('lists study programs alphabetically without requiring a session', async () => {
  const context = await createTestContext()
  try {
    const programs = await context.api.studyPrograms.listStudyPrograms()
    assert.deepEqual(
      programs.map(({ name }) => name),
      ['Architecture', 'Zoology']
    )
    assert.deepEqual(programs[0], {
      id: 2,
      name: 'Architecture',
      faculty: 'Design',
      totalEcts: 210
    })
  } finally {
    context.client.close()
  }
})

test('protects course listing and returns only the requested program in semester/name order', async () => {
  const context = await createTestContext()
  try {
    await assert.rejects(
      () => context.api.studyPrograms.listStudyProgramCourses({ path: { id: 1 } }),
      (error: unknown) => error instanceof ApiClientError && error.code === 'UNAUTHENTICATED'
    )

    context.session.start(42)
    const courses = await context.api.studyPrograms.listStudyProgramCourses({ path: { id: 1 } })
    assert.deepEqual(
      courses.map(({ name }) => name),
      ['Animal Biology', 'Cell Biology', 'Zoology Lab']
    )
    assert.ok(courses.every(({ studyProgramId }) => studyProgramId === 1))
    assert.deepEqual(
      await context.api.studyPrograms.listStudyProgramCourses({ path: { id: 999 } }),
      []
    )
  } finally {
    context.client.close()
  }
})

test('rejects malformed and extra IPC input before invoking a handler', async () => {
  const context = await createTestContext()
  try {
    context.session.start(42)
    for (const input of [{ path: { id: '1' } }, { path: { id: 1 }, extra: true }]) {
      const result = await context.dispatch({} as never, {
        operationId: 'listStudyProgramCourses',
        input,
        requestId: 'invalid-study-program-input'
      })
      assert.equal(result.ok, false)
      if (!result.ok) assert.equal(result.error.code, 'VALIDATION_ERROR')
    }
  } finally {
    context.client.close()
  }
})
