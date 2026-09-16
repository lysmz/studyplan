import { pgTable, serial, text, integer, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const studyProgramsTable = pgTable("study_programs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  faculty: text("faculty").notNull(),
  totalEcts: integer("total_ects").notNull().default(180),
});

export const coursesTable = pgTable("courses", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ects: numeric("ects", { precision: 5, scale: 1 }).notNull(),
  semester: text("semester").notNull(),
  studyProgramId: integer("study_program_id").notNull(),
  isRequired: boolean("is_required").notNull().default(true),
});

export const insertStudyProgramSchema = createInsertSchema(studyProgramsTable).omit({ id: true });
export const insertCourseSchema = createInsertSchema(coursesTable).omit({ id: true });
export type InsertStudyProgram = z.infer<typeof insertStudyProgramSchema>;
export type StudyProgram = typeof studyProgramsTable.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type Course = typeof coursesTable.$inferSelect;
