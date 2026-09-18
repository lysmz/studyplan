import { parseICS, type ParameterValue } from 'node-ical'
import type { EventType, InsertEvent } from '../db/schema'

const HOUR_IN_MILLISECONDS = 60 * 60 * 1000
const DAY_IN_MILLISECONDS = 24 * HOUR_IN_MILLISECONDS

export type ParsedIcalEvent = Omit<InsertEvent, 'userId'>

export interface ParsedIcalCalendar {
  events: ParsedIcalEvent[]
  skippedCount: number
}

export class InvalidEventsIcalError extends Error {
  constructor(message = 'Die ICS-Datei ist ungültig.') {
    super(message)
    this.name = 'InvalidEventsIcalError'
  }
}

export function calculateIsMultiDay(startDate: Date, endDate: Date): boolean {
  return endDate.getTime() - startDate.getTime() >= DAY_IN_MILLISECONDS
}

function parameterValueToString(value: ParameterValue | undefined): string | null {
  if (value === undefined) return null
  return typeof value === 'string' ? value : String(value.val)
}

function inferEventType(summary: string): EventType {
  const lower = summary.toLowerCase()
  if (/prüfung|klausur|exam|test/.test(lower)) return 'exam'
  if (/deadline|abgabe|frist/.test(lower)) return 'deadline'
  if (/anmeld|anmeldefrist|registration/.test(lower)) return 'registration'
  if (/vorlesung|lecture|übung|seminar|tutorium/.test(lower)) return 'lecture'
  return 'other'
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

export function parseEventsIcal(icalText: string): ParsedIcalCalendar {
  if (!/BEGIN:VCALENDAR/i.test(icalText) || !/END:VCALENDAR/i.test(icalText)) {
    throw new InvalidEventsIcalError()
  }

  let calendar: ReturnType<typeof parseICS>
  try {
    calendar = parseICS(icalText)
  } catch {
    throw new InvalidEventsIcalError()
  }

  const events: ParsedIcalEvent[] = []
  let skippedCount = 0

  for (const component of Object.values(calendar)) {
    if (!component || component.type !== 'VEVENT') continue

    const title = parameterValueToString(component.summary)
    if (!title || !isValidDate(component.start)) {
      skippedCount += 1
      continue
    }

    const startDate = new Date(component.start)
    if (component.end && !isValidDate(component.end)) {
      skippedCount += 1
      continue
    }
    const parsedEndDate = component.end ? new Date(component.end) : undefined
    if (parsedEndDate && parsedEndDate.getTime() < startDate.getTime()) {
      skippedCount += 1
      continue
    }
    const endDate =
      parsedEndDate && parsedEndDate.getTime() > startDate.getTime()
        ? parsedEndDate
        : new Date(startDate.getTime() + HOUR_IN_MILLISECONDS)

    events.push({
      title,
      description: parameterValueToString(component.description),
      startDate,
      endDate,
      type: inferEventType(title),
      importance: 'medium',
      isMultiDay: calculateIsMultiDay(startDate, endDate),
      location: parameterValueToString(component.location)
    })
  }

  return { events, skippedCount }
}
