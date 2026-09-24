import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import { DrizzleAppSchema, toPowerSyncTable } from '@powersync/drizzle-driver'
import { eventsTable } from '../../db/schema'

export const spikeEventTypes = ['exam', 'deadline', 'registration', 'lecture', 'other'] as const
export type SpikeEventType = (typeof spikeEventTypes)[number]

export const spikeEventImportanceValues = ['high', 'medium', 'low'] as const
export type SpikeEventImportance = (typeof spikeEventImportanceValues)[number]

export const spikeEventsTable = sqliteTable(
  'spike_events',
  {
    id: text('id').primaryKey().notNull(),
    ownerId: text('owner_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    startDate: text('start_date').notNull(),
    endDate: text('end_date').notNull(),
    type: text('type', { enum: spikeEventTypes }).notNull(),
    importance: text('importance', { enum: spikeEventImportanceValues }).notNull(),
    isMultiDay: integer('is_multi_day', { mode: 'boolean' }).notNull(),
    location: text('location'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [
    index('spike_events_owner_idx').on(table.ownerId),
    index('spike_events_start_date_idx').on(table.startDate)
  ]
)

export const powerSyncDrizzleSchemaDefinition = { spikeEventsTable }

export const powerSyncDrizzleSchema = new DrizzleAppSchema(powerSyncDrizzleSchemaDefinition)

export interface ExistingEventsCompatibilityEvidence {
  drizzleIdDataType: string
  powerSyncIdType: 'implicit-text'
  mappedColumns: Record<string, string | undefined>
  requiresIdMigration: boolean
  requiresOwnerMigration: boolean
}

export function inspectExistingEventsCompatibility(): ExistingEventsCompatibilityEvidence {
  const converted = toPowerSyncTable(eventsTable)
  const drizzleIdDataType = String(eventsTable.id.dataType)
  const drizzleOwnerDataType = String(eventsTable.userId.dataType)
  return {
    drizzleIdDataType,
    powerSyncIdType: 'implicit-text',
    mappedColumns: Object.fromEntries(converted.columns.map((item) => [item.name, item.type])),
    requiresIdMigration: drizzleIdDataType !== 'string',
    requiresOwnerMigration: drizzleOwnerDataType !== 'string'
  }
}

export type SpikeEventRow = typeof spikeEventsTable.$inferSelect
