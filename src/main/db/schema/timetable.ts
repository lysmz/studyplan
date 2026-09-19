import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { createInsertSchema } from 'drizzle-zod'
import { z } from 'zod/v4'

export const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
export type WeekDay = (typeof weekDays)[number]

export const timeSlots = ['slot1', 'slot2', 'slot3', 'slot4', 'slot5', 'slot6'] as const
export type TimeSlot = (typeof timeSlots)[number]

export const timetableEntriesTable = sqliteTable('timetable_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  courseName: text('course_name').notNull(),
  weekDay: text('week_day', { enum: weekDays }).notNull(),
  timeSlot: text('time_slot', { enum: timeSlots }).notNull(),
  room: text('room'),
  professor: text('professor'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(true),
  color: text('color'),
  userId: integer('user_id').notNull()
})

export const timetablePresetsTable = sqliteTable('timetable_presets', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  faculty: text('faculty').notNull()
})

export const presetEntriesTable = sqliteTable('preset_entries', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  presetId: integer('preset_id').notNull(),
  courseName: text('course_name').notNull(),
  weekDay: text('week_day', { enum: weekDays }).notNull(),
  timeSlot: text('time_slot', { enum: timeSlots }).notNull(),
  room: text('room'),
  professor: text('professor')
})

export const insertTimetableEntrySchema = createInsertSchema(timetableEntriesTable).omit({
  id: true
})
export const insertPresetSchema = createInsertSchema(timetablePresetsTable).omit({ id: true })
export const insertPresetEntrySchema = createInsertSchema(presetEntriesTable).omit({ id: true })

export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>
export type TimetableEntry = typeof timetableEntriesTable.$inferSelect
export type TimetablePreset = typeof timetablePresetsTable.$inferSelect
export type PresetEntry = typeof presetEntriesTable.$inferSelect
