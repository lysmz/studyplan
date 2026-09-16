import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const activityTypes = [
  'grade_added',
  'grade_updated',
  'event_added',
  'event_deleted'
] as const
export type ActivityType = (typeof activityTypes)[number]

export const activityLogTable = sqliteTable('activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: activityTypes }).notNull(),
  description: text('description').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

export const insertActivityLogSchema = createInsertSchema(activityLogTable).omit({
  id: true,
  createdAt: true
})
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>
export type ActivityLog = typeof activityLogTable.$inferSelect
