import { pgTable, serial, text, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const weekDayEnum = pgEnum("week_day", ["monday", "tuesday", "wednesday", "thursday", "friday"]);
export const timeSlotEnum = pgEnum("time_slot", ["slot1", "slot2", "slot3", "slot4", "slot5", "slot6"]);

export const timetableEntriesTable = pgTable("timetable_entries", {
  id: serial("id").primaryKey(),
  courseName: text("course_name").notNull(),
  weekDay: weekDayEnum("week_day").notNull(),
  timeSlot: timeSlotEnum("time_slot").notNull(),
  room: text("room"),
  professor: text("professor"),
  isCustom: boolean("is_custom").notNull().default(true),
  color: text("color"),
  userId: integer("user_id").notNull(),
});

export const timetablePresetsTable = pgTable("timetable_presets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  faculty: text("faculty").notNull(),
});

export const presetEntriesTable = pgTable("preset_entries", {
  id: serial("id").primaryKey(),
  presetId: integer("preset_id").notNull(),
  courseName: text("course_name").notNull(),
  weekDay: weekDayEnum("week_day").notNull(),
  timeSlot: timeSlotEnum("time_slot").notNull(),
  room: text("room"),
  professor: text("professor"),
});

export const insertTimetableEntrySchema = createInsertSchema(timetableEntriesTable).omit({ id: true });
export const insertPresetSchema = createInsertSchema(timetablePresetsTable).omit({ id: true });
export const insertPresetEntrySchema = createInsertSchema(presetEntriesTable).omit({ id: true });

export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>;
export type TimetableEntry = typeof timetableEntriesTable.$inferSelect;
export type TimetablePreset = typeof timetablePresetsTable.$inferSelect;
export type PresetEntry = typeof presetEntriesTable.$inferSelect;
