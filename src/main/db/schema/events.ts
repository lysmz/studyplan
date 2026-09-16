import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const eventTypes = ['exam', 'deadline', 'registration', 'lecture', 'other'] as const
export type EventType = (typeof eventTypes)[number]

export const importanceValues = ['high', 'medium', 'low'] as const
export type Importance = (typeof importanceValues)[number]

export const eventsTable = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  type: text('type', { enum: eventTypes }).notNull().default('other'),
  importance: text('importance', { enum: importanceValues }).notNull().default('medium'),
  isMultiDay: integer('is_multi_day', { mode: 'boolean' }).notNull().default(false),
  location: text('location'),
  userId: integer('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export const insertEventSchema = createInsertSchema(eventsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export type InsertEvent = z.infer<typeof insertEventSchema>
export type Event = typeof eventsTable.$inferSelect
