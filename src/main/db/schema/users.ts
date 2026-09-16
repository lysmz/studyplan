import { pgTable, serial, text, integer, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  displayName: text('display_name').notNull(),
  studyProgramId: integer('study_program_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
})

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true })
export type InsertUser = z.infer<typeof insertUserSchema>
export type User = typeof usersTable.$inferSelect
