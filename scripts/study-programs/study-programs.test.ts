import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
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
  type ApiTransport,
  type StudyProgram,
  type Course
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

const sampleCatalog = JSON.parse(
  readFileSync('supabase/functions/study-catalog/catalog.json', 'utf8')
) as { programs: StudyProgram[]; courses: Course[] }

async function createTestContext(
  fetchCatalog: typeof fetch = fetch,
  catalogUrl = 'https://catalog.example.test/catalog.json'
): Promise<TestContext> {
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
  const service = new StudyProgramsService(repository, catalogUrl, fetchCatalog)
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

test('fetches a HTTPS catalog without redirects, imports programs, and updates without duplicates', async () => {
  const catalog = structuredClone(sampleCatalog)
  let requests = 0
  const context = await createTestContext(async (input, init) => {
    assert.equal(input, 'https://catalog.example.test/catalog.json')
    assert.equal(init?.redirect, 'error')
    assert.equal(new Headers(init?.headers).has('Authorization'), false)
    requests += 1
    return Response.json(catalog)
  })

  try {
    // Downloading the public catalog does not require a Supabase or local account.
    const imported = await context.api.studyPrograms.refreshStudyCatalog()
    assert.deepEqual(imported, { programCount: 3, courseCount: 12 })
    assert.equal((await context.api.studyPrograms.listStudyPrograms()).length, 5)
    context.session.start(42)
    for (const program of catalog.programs) {
      assert.deepEqual(
        await context.api.studyPrograms.listStudyProgramCourses({ path: { id: program.id } }),
        catalog.courses
          .filter((course) => course.studyProgramId === program.id)
          .sort((a, b) => a.semester.localeCompare(b.semester) || a.name.localeCompare(b.name))
      )
    }

    await context.api.studyPrograms.refreshStudyCatalog()
    assert.equal((await context.api.studyPrograms.listStudyPrograms()).length, 5)
    const courseCount = await context.client.execute('SELECT count(*) AS count FROM courses')
    assert.equal(courseCount.rows[0].count, 16)

    catalog.programs[0].name = 'Physik – aktualisiert'
    catalog.courses[0].name = "Newton's Mechanik"
    catalog.courses[0].ects = 7.5
    await context.api.studyPrograms.refreshStudyCatalog()
    const programs = await context.api.studyPrograms.listStudyPrograms()
    assert.equal(programs.find((program) => program.id === 6)?.name, 'Physik – aktualisiert')
    const courses = await context.api.studyPrograms.listStudyProgramCourses({ path: { id: 6 } })
    assert.equal(courses.find((course) => course.id === 34)?.ects, 7.5)
    assert.equal(courses.find((course) => course.id === 34)?.name, "Newton's Mechanik")
    assert.equal(programs.find((program) => program.id === 1)?.name, 'Zoology')
    assert.equal(requests, 3)
  } finally {
    context.client.close()
  }
})

test('unsafe catalog URLs are rejected before fetching or changing local data', async () => {
  for (const url of [
    'http://example.test/catalog',
    'file:///secret',
    'invalid',
    'https://user:secret@example.test'
  ]) {
    let requests = 0
    const context = await createTestContext(async () => {
      requests += 1
      return Response.json(sampleCatalog)
    }, url)
    try {
      const before = await context.api.studyPrograms.listStudyPrograms()
      await assert.rejects(() => context.api.studyPrograms.refreshStudyCatalog(), ApiClientError)
      assert.equal(requests, 0)
      assert.deepEqual(await context.api.studyPrograms.listStudyPrograms(), before)
    } finally {
      context.client.close()
    }
  }
})

test('failed downloads and invalid JSON keep local data intact, and a later retry succeeds', async () => {
  let mode: 'offline' | 'http-error' | 'invalid-json' | 'invalid-shape' | 'success' = 'offline'
  const context = await createTestContext(async () => {
    if (mode === 'offline') throw new TypeError('fetch failed')
    if (mode === 'http-error') return new Response('Unavailable', { status: 503 })
    if (mode === 'invalid-json') return new Response('{broken')
    if (mode === 'invalid-shape')
      return Response.json({ programs: sampleCatalog.programs, courses: [{}] })
    return Response.json(sampleCatalog)
  })

  try {
    const before = await context.api.studyPrograms.listStudyPrograms()
    for (const failure of ['offline', 'http-error', 'invalid-json', 'invalid-shape'] as const) {
      mode = failure
      await assert.rejects(() => context.api.studyPrograms.refreshStudyCatalog(), ApiClientError)
      assert.deepEqual(await context.api.studyPrograms.listStudyPrograms(), before)
      const courses = await context.client.execute('SELECT count(*) AS count FROM courses')
      assert.equal(courses.rows[0].count, 4)
    }

    mode = 'success'
    await context.api.studyPrograms.refreshStudyCatalog()
    assert.equal((await context.api.studyPrograms.listStudyPrograms()).length, 5)
  } finally {
    context.client.close()
  }
})

test('a database write failure rolls back the complete catalog import', async () => {
  const context = await createTestContext(async () => Response.json(sampleCatalog))
  try {
    await context.client.execute(`
      CREATE TRIGGER reject_sample_course BEFORE INSERT ON courses
      WHEN NEW.id = 45 BEGIN SELECT RAISE(ABORT, 'simulated write failure'); END
    `)
    const before = await context.api.studyPrograms.listStudyPrograms()
    await assert.rejects(() => context.api.studyPrograms.refreshStudyCatalog(), ApiClientError)
    assert.deepEqual(await context.api.studyPrograms.listStudyPrograms(), before)
    const courses = await context.client.execute('SELECT count(*) AS count FROM courses')
    assert.equal(courses.rows[0].count, 4)
  } finally {
    context.client.close()
  }
})

test('concurrent refresh requests share one download and import', async () => {
  let calls = 0
  let finishDownload!: () => void
  const downloadReady = new Promise<void>((resolve) => {
    finishDownload = resolve
  })
  const context = await createTestContext(async () => {
    calls += 1
    await downloadReady
    return Response.json(sampleCatalog)
  })

  try {
    const first = context.api.studyPrograms.refreshStudyCatalog()
    const second = context.api.studyPrograms.refreshStudyCatalog()
    finishDownload()
    assert.deepEqual(await first, await second)
    assert.equal(calls, 1)
    assert.equal((await context.api.studyPrograms.listStudyPrograms()).length, 5)
  } finally {
    context.client.close()
  }
})
