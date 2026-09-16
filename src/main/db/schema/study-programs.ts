import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const studyProgramsTable = sqliteTable('study_programs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  faculty: text('faculty').notNull(),
  totalEcts: integer('total_ects').notNull().default(180)
})

export const coursesTable = sqliteTable('courses', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  ects: real('ects').notNull(),
  semester: text('semester').notNull(),
  studyProgramId: integer('study_program_id').notNull(),
  isRequired: integer('is_required', { mode: 'boolean' }).notNull().default(true)
})

export const insertStudyProgramSchema = createInsertSchema(studyProgramsTable).omit({ id: true })
export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true })
export type InsertStudyProgram = z.infer<typeof insertStudyProgramSchema>
export type StudyProgram = typeof studyProgramsTable.$inferSelect
export type InsertCourse = z.infer<typeof insertCourseSchema>
export type Course = typeof coursesTable.$inferSelect
