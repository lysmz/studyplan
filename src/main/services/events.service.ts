import type { ApiInput, EventInput, EventUpdate } from '../../shared/api'
import type { Event } from '../db/schema'
import { ActivityLogRepository } from '../repositories/activity-log.repository'
import {
  EventsRepository,
  type EventChanges,
  type EventFilters
} from '../repositories/events.repository'

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000
type ListEventsQuery = NonNullable<ApiInput<'listEvents'>['query']>

export class EventNotFoundError extends Error {
  constructor() {
    super('Event not found.')
    this.name = 'EventNotFoundError'
  }
}

function isMultiDay(startDate: Date, endDate: Date): boolean {
  return endDate.getTime() - startDate.getTime() >= DAY_IN_MILLISECONDS
}

export class EventsService {
  constructor(
    private readonly events: EventsRepository,
    private readonly activityLog: ActivityLogRepository
  ) {}

  listEvents(userId: number, query?: ListEventsQuery): Promise<Event[]> {
    const filters: EventFilters = {
      type: query?.type,
      importance: query?.importance
    }

    if (query?.month !== undefined && query.year !== undefined) {
      filters.startsAtOrAfter = new Date(query.year, query.month - 1, 1)
      filters.startsBefore = new Date(query.year, query.month, 1)
    }

    return this.events.listByUserId(userId, filters)
  }

  async createEvent(userId: number, input: EventInput): Promise<Event> {
    const event = await this.events.createEvent({
      title: input.title,
      description: input.description ?? null,
      startDate: input.startDate,
      endDate: input.endDate,
      type: input.type,
      importance: input.importance,
      isMultiDay: isMultiDay(input.startDate, input.endDate),
      location: input.location ?? null,
      userId
    })

    await this.activityLog.createActivity({
      type: 'event_added',
      description: `Termin "${event.title}" hinzugefügt`,
      userId
    })

    return event
  }

  async getEvent(userId: number, eventId: number): Promise<Event> {
    const event = await this.events.findByIdAndUserId(eventId, userId)
    if (!event) throw new EventNotFoundError()
    return event
  }

  async updateEvent(userId: number, eventId: number, input: EventUpdate): Promise<Event> {
    const existing = await this.events.findByIdAndUserId(eventId, userId)
    if (!existing) throw new EventNotFoundError()

    const changes: EventChanges = {}
    if (input.title !== undefined) changes.title = input.title
    if (input.description !== undefined) changes.description = input.description
    if (input.startDate !== undefined) changes.startDate = input.startDate
    if (input.endDate !== undefined) changes.endDate = input.endDate
    if (input.type !== undefined) changes.type = input.type
    if (input.importance !== undefined) changes.importance = input.importance
    if (input.location !== undefined) changes.location = input.location

    if (input.startDate !== undefined || input.endDate !== undefined) {
      changes.isMultiDay = isMultiDay(
        input.startDate ?? existing.startDate,
        input.endDate ?? existing.endDate
      )
    }

    const event = await this.events.updateByIdAndUserId(eventId, userId, changes)
    if (!event) throw new EventNotFoundError()
    return event
  }

  async deleteEvent(userId: number, eventId: number): Promise<undefined> {
    const event = await this.events.deleteByIdAndUserId(eventId, userId)
    if (!event) throw new EventNotFoundError()

    await this.activityLog.createActivity({
      type: 'event_deleted',
      description: `Termin "${event.title}" gelöscht`,
      userId
    })

    return undefined
  }
}
