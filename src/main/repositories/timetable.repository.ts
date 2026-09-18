import { and, eq } from 'drizzle-orm'
import type { AppDatabase } from '../db'
import {
  presetEntriesTable,
  timetableEntriesTable,
  timetablePresetsTable,
  type InsertTimetableEntry,
  type PresetEntry,
  type TimetableEntry,
  type TimetablePreset
} from '../db/schema'

export class TimetableRepository {
  constructor(private readonly database: AppDatabase) {}

  async listEntriesByUserId(userId: number): Promise<TimetableEntry[]> {
    return this.database
      .select()
      .from(timetableEntriesTable)
      .where(eq(timetableEntriesTable.userId, userId))
      .orderBy(timetableEntriesTable.weekDay, timetableEntriesTable.timeSlot)
  }

  async createEntry(values: InsertTimetableEntry): Promise<TimetableEntry> {
    const [entry] = await this.database.insert(timetableEntriesTable).values(values).returning()
    if (!entry) throw new Error('The database did not return the created timetable entry.')
    return entry
  }

  async deleteEntryByIdAndUserId(
    entryId: number,
    userId: number
  ): Promise<TimetableEntry | undefined> {
    const [entry] = await this.database
      .delete(timetableEntriesTable)
      .where(and(eq(timetableEntriesTable.id, entryId), eq(timetableEntriesTable.userId, userId)))
      .returning()
    return entry
  }

  async clearEntriesByUserId(userId: number): Promise<void> {
    await this.database
      .delete(timetableEntriesTable)
      .where(eq(timetableEntriesTable.userId, userId))
  }

  async listPresets(): Promise<TimetablePreset[]> {
    return this.database.select().from(timetablePresetsTable).orderBy(timetablePresetsTable.id)
  }

  async listPresetEntries(presetId: number): Promise<PresetEntry[]> {
    return this.database
      .select()
      .from(presetEntriesTable)
      .where(eq(presetEntriesTable.presetId, presetId))
      .orderBy(presetEntriesTable.weekDay, presetEntriesTable.timeSlot)
  }
}
