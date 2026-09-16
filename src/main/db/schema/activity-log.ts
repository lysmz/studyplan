import { pgTable, serial, text, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const activityTypeEnum = pgEnum('activity_type', [
  'grade_added',
  'grade_updated',
  'event_added',
  'event_deleted'
])

export const activityLogTable = pgTable('activity_log', {
  id: serial('id').primaryKey(),
  type: activityTypeEnum('type').notNull(),
  description: text('description').notNull(),
  userId: integer('user_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const insertActivityLogSchema = createInsertSchema(activityLogTable).omit({
  id: true,
  createdAt: true
})
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>
export type ActivityLog = typeof activityLogTable.$inferSelect
