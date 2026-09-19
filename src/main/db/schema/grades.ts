import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const gradesTable = sqliteTable('grades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseName: text('course_name').notNull(),
  grade: real('grade'),
  ects: real('ects').notNull(),
  semester: text('semester').notNull(),
  passed: integer('passed', { mode: 'boolean' }).notNull().default(false),
  notes: text('notes'),
  userId: integer('user_id').notNull(),
  courseId: integer('course_id'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export const insertGradeSchema = createInsertSchema(gradesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export type InsertGrade = z.infer<typeof insertGradeSchema>
export type Grade = typeof gradesTable.$inferSelect
