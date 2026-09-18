import type { TimetableEntryInput } from '../../shared/api'
import type { PresetEntry, TimetableEntry, TimetablePreset } from '../db/schema'
import { TimetableRepository } from '../repositories/timetable.repository'

export class TimetableEntryNotFoundError extends Error {
  constructor() {
    super('Timetable entry not found.')
    this.name = 'TimetableEntryNotFoundError'
  }
}

export class TimetableService {
  constructor(private readonly timetable: TimetableRepository) {}

  listEntries(userId: number): Promise<TimetableEntry[]> {
    return this.timetable.listEntriesByUserId(userId)
  }

  addEntry(userId: number, input: TimetableEntryInput): Promise<TimetableEntry> {
    return this.timetable.createEntry({
      courseName: input.courseName,
      weekDay: input.weekDay,
      timeSlot: input.timeSlot,
      room: input.room ?? null,
      professor: input.professor ?? null,
      isCustom: input.isCustom,
      color: input.color ?? null,
      userId
    })
  }

  async removeEntry(userId: number, entryId: number): Promise<undefined> {
    const entry = await this.timetable.deleteEntryByIdAndUserId(entryId, userId)
    if (!entry) throw new TimetableEntryNotFoundError()
    return undefined
  }

  async clearTimetable(userId: number): Promise<undefined> {
    await this.timetable.clearEntriesByUserId(userId)
    return undefined
  }

  listPresets(): Promise<TimetablePreset[]> {
    return this.timetable.listPresets()
  }

  getPresetEntries(presetId: number): Promise<PresetEntry[]> {
    return this.timetable.listPresetEntries(presetId)
  }
}
