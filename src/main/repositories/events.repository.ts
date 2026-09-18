import { and, eq, gte, lt, lte } from 'drizzle-orm'
import type { AppDatabase } from '../db'
import {
  eventsTable,
  type Event,
  type EventType,
  type Importance,
  type InsertEvent
} from '../db/schema'

export interface EventFilters {
  startsAtOrAfter?: Date
  startsBefore?: Date
  startsAtOrBefore?: Date
  type?: EventType
  importance?: Importance
}

export type EventChanges = Partial<Omit<InsertEvent, 'userId'>>

export class EventsRepository {
  constructor(private readonly database: AppDatabase) {}

  async listByUserId(userId: number, filters: EventFilters = {}): Promise<Event[]> {
    return this.database
      .select()
      .from(eventsTable)
      .where(
        and(
          eq(eventsTable.userId, userId),
          filters.startsAtOrAfter ? gte(eventsTable.startDate, filters.startsAtOrAfter) : undefined,
          filters.startsBefore ? lt(eventsTable.startDate, filters.startsBefore) : undefined,
          filters.startsAtOrBefore
            ? lte(eventsTable.startDate, filters.startsAtOrBefore)
            : undefined,
          filters.type ? eq(eventsTable.type, filters.type) : undefined,
          filters.importance ? eq(eventsTable.importance, filters.importance) : undefined
        )
      )
      .orderBy(eventsTable.startDate)
  }

  async createEvent(values: InsertEvent): Promise<Event> {
    const [event] = await this.database.insert(eventsTable).values(values).returning()
    if (!event) throw new Error('The database did not return the created event.')
    return event
  }

  async createManyEvents(values: InsertEvent[]): Promise<Event[]> {
    if (values.length === 0) return []
    return this.database.insert(eventsTable).values(values).returning()
  }

  async findByIdAndUserId(eventId: number, userId: number): Promise<Event | undefined> {
    const [event] = await this.database
      .select()
      .from(eventsTable)
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.userId, userId)))
      .limit(1)
    return event
  }

  async updateByIdAndUserId(
    eventId: number,
    userId: number,
    changes: EventChanges
  ): Promise<Event | undefined> {
    if (Object.keys(changes).length === 0) return this.findByIdAndUserId(eventId, userId)

    const [event] = await this.database
      .update(eventsTable)
      .set(changes)
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.userId, userId)))
      .returning()
    return event
  }

  async deleteByIdAndUserId(eventId: number, userId: number): Promise<Event | undefined> {
    const [event] = await this.database
      .delete(eventsTable)
      .where(and(eq(eventsTable.id, eventId), eq(eventsTable.userId, userId)))
      .returning()
    return event
  }
}
