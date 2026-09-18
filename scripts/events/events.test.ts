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
import type { IcalFilePicker, IcalFileSelection } from '../../src/main/files/ical-file-picker'
import { createApiDispatcher } from '../../src/main/ipc/api-dispatcher'
import { createEventsHandlers } from '../../src/main/ipc/handlers/events.handlers'
import { ActivityLogRepository } from '../../src/main/repositories/activity-log.repository'
import { EventsRepository } from '../../src/main/repositories/events.repository'
import { InvalidEventsIcalError, parseEventsIcal } from '../../src/main/services/events-ical.parser'
import { EventsService } from '../../src/main/services/events.service'

class StubIcalFilePicker implements IcalFilePicker {
  calls = 0

  constructor(public selection: IcalFileSelection = { status: 'cancelled' }) {}

  async selectIcalFile(): Promise<IcalFileSelection> {
    this.calls += 1
    return this.selection
  }
}

interface TestContext {
  client: Client
  session: SessionService
  api: ReturnType<typeof createApiClient>
  dispatch: ReturnType<typeof createApiDispatcher>
  icalFilePicker: IcalFilePicker
}

async function createTestContext(
  icalFilePicker: IcalFilePicker = new StubIcalFilePicker()
): Promise<TestContext> {
  const client = createClient({ url: 'file::memory:' })
  await client.batch(
    [
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
  const service = new EventsService(
    new EventsRepository(database),
    new ActivityLogRepository(database)
  )
  const session = new SessionService()
  const dispatch = createApiDispatcher({
    handlers: createEventsHandlers(service, session, icalFilePicker),
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

  return { client, session, api: createApiClient(transport), dispatch, icalFilePicker }
}

async function insertEvent(
  client: Client,
  values: {
    title: string
    startDate: Date
    endDate: Date
    type?: string
    importance?: string
    userId?: number
  }
): Promise<void> {
  await client.execute({
    sql: `INSERT INTO events
      (title, start_date, end_date, type, importance, is_multi_day, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [
      values.title,
      Math.floor(values.startDate.getTime() / 1000),
      Math.floor(values.endDate.getTime() / 1000),
      values.type ?? 'other',
      values.importance ?? 'medium',
      values.endDate.getTime() - values.startDate.getTime() >= 24 * 60 * 60 * 1000 ? 1 : 0,
      values.userId ?? 7
    ]
  })
}

test('protects every personal event operation with the current session', async () => {
  const context = await createTestContext()
  try {
    const date = new Date(2026, 8, 10, 10)
    const calls: Array<[ApiOperationId, unknown]> = [
      ['listEvents', {}],
      [
        'createEvent',
        {
          body: {
            title: 'Exam',
            startDate: date,
            endDate: new Date(date.getTime() + 60 * 60 * 1000),
            type: 'exam',
            importance: 'high'
          }
        }
      ],
      ['importEventsIcal', {}],
      ['getEvent', { path: { id: 1 } }],
      ['updateEvent', { path: { id: 1 }, body: { title: 'Updated' } }],
      ['deleteEvent', { path: { id: 1 } }]
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

test('parses importable VEVENT fields and applies legacy defaults and inference', () => {
  const parsed = parseEventsIcal(
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Studyplan//Tests//EN',
      'BEGIN:VEVENT',
      'UID:exam-1',
      'DTSTAMP:20260901T080000Z',
      'DTSTART:20260920T090000Z',
      'SUMMARY:Klausur Datenbanken',
      'DESCRIPTION:Schriftliche Prüfung',
      'LOCATION:Raum A1',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')
  )

  assert.equal(parsed.skippedCount, 0)
  assert.equal(parsed.events.length, 1)
  assert.deepEqual(parsed.events[0], {
    title: 'Klausur Datenbanken',
    description: 'Schriftliche Prüfung',
    startDate: new Date('2026-09-20T09:00:00.000Z'),
    endDate: new Date('2026-09-20T10:00:00.000Z'),
    type: 'exam',
    importance: 'medium',
    isMultiDay: false,
    location: 'Raum A1'
  })
})

test('rejects content that is not an iCalendar document', () => {
  assert.throws(() => parseEventsIcal('not a calendar'), InvalidEventsIcalError)
})

test('imports a native-selected ICS for the current user and records one activity', async () => {
  const picker = new StubIcalFilePicker({
    status: 'selected',
    contents: [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Studyplan//Tests//EN',
      'BEGIN:VEVENT',
      'UID:lecture-1',
      'DTSTAMP:20260901T080000Z',
      'DTSTART:20260921T080000Z',
      'DTEND:20260922T080000Z',
      'SUMMARY:Vorlesung Informatik',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n')
  })
  const context = await createTestContext(picker)
  try {
    context.session.start(7)
    assert.deepEqual(await context.api.events.importEventsIcal(), {
      status: 'imported',
      importedCount: 1,
      skippedCount: 0
    })

    const imported = (await context.api.events.listEvents()).find(
      ({ title }) => title === 'Vorlesung Informatik'
    )
    assert.ok(imported)
    assert.equal(imported.userId, 7)
    assert.equal(imported.type, 'lecture')
    assert.equal(imported.importance, 'medium')
    assert.equal(imported.isMultiDay, true)

    const activity = await context.client.execute(
      "SELECT type, description, user_id FROM activity_log WHERE description LIKE '%ICS%'"
    )
    assert.deepEqual(activity.rows, [
      { type: 'event_added', description: '1 Termine aus ICS importiert', user_id: 7 }
    ])
  } finally {
    context.client.close()
  }
})

test('treats native picker cancellation as a successful no-op', async () => {
  const picker = new StubIcalFilePicker()
  const context = await createTestContext(picker)
  try {
    context.session.start(7)
    assert.deepEqual(await context.api.events.importEventsIcal(), {
      status: 'cancelled',
      importedCount: 0,
      skippedCount: 0
    })
    assert.equal(picker.calls, 1)
  } finally {
    context.client.close()
  }
})

test('maps invalid selected ICS content to the declared validation error', async () => {
  const context = await createTestContext(
    new StubIcalFilePicker({ status: 'selected', contents: 'invalid' })
  )
  try {
    context.session.start(7)
    await assert.rejects(
      () => context.api.events.importEventsIcal(),
      (error: unknown) => {
        assert.ok(error instanceof ApiClientError)
        assert.equal(error.code, 'VALIDATION_ERROR')
        assert.deepEqual(error.details, {
          status: 400,
          body: { error: 'Die ICS-Datei ist ungültig.' }
        })
        return true
      }
    )
  } finally {
    context.client.close()
  }
})

test('lists only the current user events in start order and applies event filters', async () => {
  const context = await createTestContext()
  try {
    await insertEvent(context.client, {
      title: 'Lecture',
      startDate: new Date(2026, 8, 5, 10),
      endDate: new Date(2026, 8, 5, 11),
      type: 'lecture',
      importance: 'medium'
    })
    await insertEvent(context.client, {
      title: 'Exam',
      startDate: new Date(2026, 8, 20, 9),
      endDate: new Date(2026, 8, 20, 11),
      type: 'exam',
      importance: 'high'
    })
    await insertEvent(context.client, {
      title: 'October deadline',
      startDate: new Date(2026, 9, 2, 12),
      endDate: new Date(2026, 9, 2, 13),
      type: 'deadline',
      importance: 'high'
    })
    await insertEvent(context.client, {
      title: 'Private',
      startDate: new Date(2026, 8, 1, 8),
      endDate: new Date(2026, 8, 1, 9),
      userId: 8
    })

    context.session.start(7)
    assert.deepEqual(
      (await context.api.events.listEvents({ query: { month: 9, year: 2026 } })).map(
        ({ title }) => title
      ),
      ['Lecture', 'Exam']
    )
    assert.deepEqual(
      (await context.api.events.listEvents({ query: { type: 'exam' } })).map(({ title }) => title),
      ['Exam']
    )
    assert.deepEqual(
      (await context.api.events.listEvents({ query: { importance: 'high' } })).map(
        ({ title }) => title
      ),
      ['Exam', 'October deadline']
    )
    assert.deepEqual(
      (await context.api.events.listEvents({ query: { month: 9 } })).map(({ title }) => title),
      ['Lecture', 'Exam', 'October deadline']
    )
  } finally {
    context.client.close()
  }
})

test('creates, reads, updates, and deletes a personal event with activity records', async () => {
  const context = await createTestContext()
  try {
    context.session.start(7)
    const startDate = new Date(2026, 8, 10, 9)
    const created = await context.api.events.createEvent({
      body: {
        title: 'Study retreat',
        description: 'Library',
        startDate,
        endDate: new Date(2026, 8, 11, 9),
        type: 'other',
        importance: 'medium',
        location: 'Campus'
      }
    })

    assert.equal(created.userId, 7)
    assert.equal(created.isMultiDay, true)
    assert.equal(
      (await context.api.events.getEvent({ path: { id: created.id } })).title,
      'Study retreat'
    )

    const updated = await context.api.events.updateEvent({
      path: { id: created.id },
      body: {
        title: 'Short study session',
        description: 'Updated session',
        endDate: new Date(2026, 8, 10, 11)
      }
    })
    assert.equal(updated.title, 'Short study session')
    assert.equal(updated.description, 'Updated session')
    assert.equal(updated.startDate.getTime(), startDate.getTime())
    assert.equal(updated.isMultiDay, false)

    assert.equal(await context.api.events.deleteEvent({ path: { id: created.id } }), undefined)

    const activity = await context.client.execute(
      'SELECT type, description, user_id FROM activity_log ORDER BY id'
    )
    assert.deepEqual(
      activity.rows.map((row) => [row.type, row.description, Number(row.user_id)]),
      [
        ['event_added', 'Termin "Study retreat" hinzugefügt', 7],
        ['event_deleted', 'Termin "Short study session" gelöscht', 7]
      ]
    )
  } finally {
    context.client.close()
  }
})

test('treats foreign and missing events as declared not-found errors', async () => {
  const context = await createTestContext()
  try {
    await insertEvent(context.client, {
      title: 'Private',
      startDate: new Date(2026, 8, 1, 8),
      endDate: new Date(2026, 8, 1, 9),
      userId: 8
    })
    context.session.start(7)

    for (const action of [
      () => context.api.events.getEvent({ path: { id: 1 } }),
      () => context.api.events.updateEvent({ path: { id: 1 }, body: { title: 'Changed' } }),
      () => context.api.events.deleteEvent({ path: { id: 1 } }),
      () => context.api.events.getEvent({ path: { id: 999 } })
    ]) {
      await assert.rejects(action, (error: unknown) => {
        assert.ok(error instanceof ApiClientError)
        assert.equal(error.code, 'NOT_FOUND')
        assert.deepEqual(error.details, {
          status: 404,
          body: { error: 'Termin nicht gefunden' }
        })
        return true
      })
    }
  } finally {
    context.client.close()
  }
})
