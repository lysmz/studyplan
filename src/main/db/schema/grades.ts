import { pgTable, serial, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const gradesTable = pgTable('grades', {
  id: serial('id').primaryKey(),
  courseName: text('course_name').notNull(),
  grade: numeric('grade', { precision: 3, scale: 1 }),
  ects: numeric('ects', { precision: 5, scale: 1 }).notNull(),
  semester: text('semester').notNull(),
  passed: boolean('passed').notNull().default(false),
  notes: text('notes'),
  userId: integer('user_id').notNull(),
  courseId: integer('course_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date())
})

export const insertGradeSchema = createInsertSchema(gradesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export type InsertGrade = z.infer<typeof insertGradeSchema>
export type Grade = typeof gradesTable.$inferSelect
