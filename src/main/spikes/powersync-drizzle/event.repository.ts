import { and, asc, eq, gte, lt, lte } from 'drizzle-orm'
import type { PowerSyncSQLiteDatabase } from '@powersync/drizzle-driver'
import {
  powerSyncDrizzleSchemaDefinition,
  spikeEventsTable,
  type SpikeEventImportance,
  type SpikeEventRow,
  type SpikeEventType
} from './schema'

export interface PowerSyncDrizzleEvent {
  id: string
  ownerId: string
  title: string
  description: string | null
  startDate: Date
  endDate: Date
  type: SpikeEventType
  importance: SpikeEventImportance
  isMultiDay: boolean
  location: string | null
  createdAt: Date
  updatedAt: Date
}

export interface CreatePowerSyncDrizzleEvent {
  ownerId: string
  title: string
  description?: string | null
  startDate: Date
  endDate: Date
  type: SpikeEventType
  importance: SpikeEventImportance
  isMultiDay: boolean
  location?: string | null
}

export interface PowerSyncDrizzleEventFilters {
  startsAtOrAfter?: Date
  startsBefore?: Date
  startsAtOrBefore?: Date
  type?: SpikeEventType
  importance?: SpikeEventImportance
}

export type PowerSyncDrizzleEventChanges = Partial<Omit<CreatePowerSyncDrizzleEvent, 'ownerId'>>

type DrizzleDatabase = PowerSyncSQLiteDatabase<typeof powerSyncDrizzleSchemaDefinition>
type SpikeEventInsert = typeof spikeEventsTable.$inferInsert

function toDomainEvent(row: SpikeEventRow): PowerSyncDrizzleEvent {
  return {
    ...row,
    startDate: new Date(row.startDate),
    endDate: new Date(row.endDate),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt)
  }
}

function createInsertRow(values: CreatePowerSyncDrizzleEvent): SpikeEventInsert {
  const timestamp = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    ownerId: values.ownerId,
    title: values.title,
    description: values.description ?? null,
    startDate: values.startDate.toISOString(),
    endDate: values.endDate.toISOString(),
    type: values.type,
    importance: values.importance,
    isMultiDay: values.isMultiDay,
    location: values.location ?? null,
    createdAt: timestamp,
    updatedAt: timestamp
  }
}

export class PowerSyncDrizzleEventsRepository {
  constructor(private readonly database: DrizzleDatabase) {}

  async listByOwnerId(
    ownerId: string,
    filters: PowerSyncDrizzleEventFilters = {}
  ): Promise<PowerSyncDrizzleEvent[]> {
    const conditions = [
      eq(spikeEventsTable.ownerId, ownerId),
      filters.startsAtOrAfter
        ? gte(spikeEventsTable.startDate, filters.startsAtOrAfter.toISOString())
        : undefined,
      filters.startsBefore
        ? lt(spikeEventsTable.startDate, filters.startsBefore.toISOString())
        : undefined,
      filters.startsAtOrBefore
        ? lte(spikeEventsTable.startDate, filters.startsAtOrBefore.toISOString())
        : undefined,
      filters.type ? eq(spikeEventsTable.type, filters.type) : undefined,
      filters.importance ? eq(spikeEventsTable.importance, filters.importance) : undefined
    ]

    const rows = await this.database
      .select()
      .from(spikeEventsTable)
      .where(and(...conditions))
      .orderBy(asc(spikeEventsTable.startDate))
    return rows.map(toDomainEvent)
  }

  async createEvent(values: CreatePowerSyncDrizzleEvent): Promise<PowerSyncDrizzleEvent> {
    const [row] = await this.database
      .insert(spikeEventsTable)
      .values(createInsertRow(values))
      .returning()
    if (!row) throw new Error('PowerSync Drizzle did not return the created event.')
    return toDomainEvent(row)
  }

  async createManyEvents(values: CreatePowerSyncDrizzleEvent[]): Promise<PowerSyncDrizzleEvent[]> {
    if (values.length === 0) return []
    const rows = await this.database
      .insert(spikeEventsTable)
      .values(values.map(createInsertRow))
      .returning()
    return rows.map(toDomainEvent)
  }

  async findByIdAndOwnerId(
    eventId: string,
    ownerId: string
  ): Promise<PowerSyncDrizzleEvent | undefined> {
    const [row] = await this.database
      .select()
      .from(spikeEventsTable)
      .where(and(eq(spikeEventsTable.id, eventId), eq(spikeEventsTable.ownerId, ownerId)))
      .limit(1)
    return row ? toDomainEvent(row) : undefined
  }

  async updateByIdAndOwnerId(
    eventId: string,
    ownerId: string,
    changes: PowerSyncDrizzleEventChanges
  ): Promise<PowerSyncDrizzleEvent | undefined> {
    if (Object.keys(changes).length === 0) return this.findByIdAndOwnerId(eventId, ownerId)

    const rowChanges: Partial<SpikeEventInsert> = { updatedAt: new Date().toISOString() }
    if (changes.title !== undefined) rowChanges.title = changes.title
    if (changes.description !== undefined) rowChanges.description = changes.description
    if (changes.startDate !== undefined) rowChanges.startDate = changes.startDate.toISOString()
    if (changes.endDate !== undefined) rowChanges.endDate = changes.endDate.toISOString()
    if (changes.type !== undefined) rowChanges.type = changes.type
    if (changes.importance !== undefined) rowChanges.importance = changes.importance
    if (changes.isMultiDay !== undefined) rowChanges.isMultiDay = changes.isMultiDay
    if (changes.location !== undefined) rowChanges.location = changes.location

    const [row] = await this.database
      .update(spikeEventsTable)
      .set(rowChanges)
      .where(and(eq(spikeEventsTable.id, eventId), eq(spikeEventsTable.ownerId, ownerId)))
      .returning()
    return row ? toDomainEvent(row) : undefined
  }

  async deleteByIdAndOwnerId(
    eventId: string,
    ownerId: string
  ): Promise<PowerSyncDrizzleEvent | undefined> {
    const [row] = await this.database
      .delete(spikeEventsTable)
      .where(and(eq(spikeEventsTable.id, eventId), eq(spikeEventsTable.ownerId, ownerId)))
      .returning()
    return row ? toDomainEvent(row) : undefined
  }
}
