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
import { createTimetableHandlers } from '../../src/main/ipc/handlers/timetable.handlers'
import { TimetableRepository } from '../../src/main/repositories/timetable.repository'
import { TimetableService } from '../../src/main/services/timetable.service'

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
      `CREATE TABLE timetable_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        course_name TEXT NOT NULL,
        week_day TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        room TEXT,
        professor TEXT,
        is_custom INTEGER NOT NULL DEFAULT 1,
        color TEXT,
        user_id INTEGER NOT NULL
      )`,
      `CREATE TABLE timetable_presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        faculty TEXT NOT NULL
      )`,
      `CREATE TABLE preset_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        preset_id INTEGER NOT NULL,
        course_name TEXT NOT NULL,
        week_day TEXT NOT NULL,
        time_slot TEXT NOT NULL,
        room TEXT,
        professor TEXT
      )`,
      `INSERT INTO timetable_entries
        (id, course_name, week_day, time_slot, room, professor, is_custom, color, user_id)
       VALUES
        (1, 'Later Monday', 'monday', 'slot2', 'A2', 'Professor B', 1, '#222222', 7),
        (2, 'Earlier Monday', 'monday', 'slot1', 'A1', 'Professor A', 1, '#111111', 7),
        (3, 'Other User Course', 'friday', 'slot1', NULL, NULL, 1, NULL, 8)`,
      `INSERT INTO timetable_presets (id, name, description, faculty) VALUES
        (2, 'Second preset', 'Second', 'Science'),
        (1, 'First preset', 'First', 'Design')`,
      `INSERT INTO preset_entries
        (preset_id, course_name, week_day, time_slot, room, professor)
       VALUES
        (1, 'Preset Later', 'monday', 'slot2', 'P2', 'Professor P2'),
        (1, 'Preset Earlier', 'monday', 'slot1', 'P1', 'Professor P1'),
        (2, 'Different Preset', 'tuesday', 'slot1', NULL, NULL)`
    ],
    'write'
  )

  const database = drizzle(client, { schema })
  const repository = new TimetableRepository(database)
  const service = new TimetableService(repository)
  const session = new SessionService()
  const dispatch = createApiDispatcher({
    handlers: createTimetableHandlers(service, session),
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

test('protects every timetable operation with the current session', async () => {
  const context = await createTestContext()
  try {
    const calls: Array<[ApiOperationId, unknown]> = [
      ['listTimetableEntries', {}],
      [
        'addTimetableEntry',
        {
          body: {
            courseName: 'Course',
            weekDay: 'monday',
            timeSlot: 'slot1',
            isCustom: true
          }
        }
      ],
      ['removeTimetableEntry', { path: { id: 1 } }],
      ['clearTimetable', {}],
      ['listTimetablePresets', {}],
      ['getTimetablePresetEntries', { path: { presetId: 1 } }]
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

test('lists and creates entries only for the authenticated user', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    const entries = await context.api.timetable.listTimetableEntries()
    assert.deepEqual(
      entries.map(({ courseName }) => courseName),
      ['Earlier Monday', 'Later Monday']
    )
    assert.ok(entries.every(({ userId }) => userId === 7))

    const created = await context.api.timetable.addTimetableEntry({
      body: {
        courseName: 'New Course',
        weekDay: 'wednesday',
        timeSlot: 'slot3',
        isCustom: true
      }
    })
    assert.equal(created.userId, 7)
    assert.equal(created.room, null)
    assert.equal(created.professor, null)
    assert.equal(created.color, null)
  } finally {
    context.client.close()
  }
})

test('enforces ownership when removing entries and returns the declared not-found error', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    await assert.rejects(
      () => context.api.timetable.removeTimetableEntry({ path: { id: 3 } }),
      (error: unknown) => {
        assert.ok(error instanceof ApiClientError)
        assert.equal(error.code, 'NOT_FOUND')
        assert.deepEqual(error.details, {
          status: 404,
          body: { error: 'Eintrag nicht gefunden' }
        })
        return true
      }
    )

    assert.equal(await context.api.timetable.removeTimetableEntry({ path: { id: 1 } }), undefined)
    assert.deepEqual(
      (await context.api.timetable.listTimetableEntries()).map(({ id }) => id),
      [2]
    )
  } finally {
    context.client.close()
  }
})

test('clears only the authenticated user timetable and remains idempotent', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    assert.equal(await context.api.timetable.clearTimetable(), undefined)
    assert.equal(await context.api.timetable.clearTimetable(), undefined)
    assert.deepEqual(await context.api.timetable.listTimetableEntries(), [])

    context.session.start(8)
    assert.deepEqual(
      (await context.api.timetable.listTimetableEntries()).map(({ courseName }) => courseName),
      ['Other User Course']
    )
  } finally {
    context.client.close()
  }
})

test('lists presets and filters their entries while preserving empty-result behavior', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    assert.deepEqual(
      (await context.api.timetable.listTimetablePresets()).map(({ id }) => id),
      [1, 2]
    )
    assert.deepEqual(
      (await context.api.timetable.getTimetablePresetEntries({ path: { presetId: 1 } })).map(
        ({ courseName }) => courseName
      ),
      ['Preset Earlier', 'Preset Later']
    )
    assert.deepEqual(
      await context.api.timetable.getTimetablePresetEntries({ path: { presetId: 999 } }),
      []
    )
  } finally {
    context.client.close()
  }
})

test('rejects invalid timetable values and ignores renderer-supplied identities', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    const invalid = await context.dispatch({} as never, {
      operationId: 'addTimetableEntry',
      input: {
        body: {
          courseName: 'Invalid weekday',
          weekDay: 'sunday',
          timeSlot: 'slot1',
          isCustom: true
        }
      },
      requestId: 'invalid-timetable-input'
    })
    assert.equal(invalid.ok, false)
    if (!invalid.ok) assert.equal(invalid.error.code, 'VALIDATION_ERROR')

    const spoofed = await context.dispatch({} as never, {
      operationId: 'addTimetableEntry',
      input: {
        body: {
          courseName: 'Spoofed owner',
          weekDay: 'monday',
          timeSlot: 'slot1',
          isCustom: true,
          userId: 99
        }
      },
      requestId: 'spoofed-timetable-owner'
    })
    assert.equal(spoofed.ok, true)
    if (spoofed.ok) assert.equal((spoofed.data as { userId: number }).userId, 7)
  } finally {
    context.client.close()
  }
})
