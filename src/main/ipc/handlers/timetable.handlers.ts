import { SessionService } from '../../auth/session.service'
import { TimetableEntryNotFoundError, TimetableService } from '../../services/timetable.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'
import { authenticated } from '../authenticated'

export function createTimetableHandlers(
  timetableService: TimetableService,
  sessionService: SessionService
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    listTimetableEntries: authenticated<'listTimetableEntries'>(sessionService, (_input, userId) =>
      timetableService.listEntries(userId)
    ),

    addTimetableEntry: authenticated<'addTimetableEntry'>(sessionService, ({ body }, userId) =>
      timetableService.addEntry(userId, body)
    ),

    removeTimetableEntry: authenticated<'removeTimetableEntry'>(
      sessionService,
      async ({ path }, userId) => {
        try {
          await timetableService.removeEntry(userId, path.id)
        } catch (error) {
          if (error instanceof TimetableEntryNotFoundError) {
            throw new ApiDeclaredResponseError(
              'removeTimetableEntry',
              { status: 404, body: { error: 'Eintrag nicht gefunden' } },
              'NOT_FOUND',
              'Timetable entry not found.'
            )
          }
          throw error
        }
      }
    ),

    clearTimetable: authenticated<'clearTimetable'>(sessionService, (_input, userId) =>
      timetableService.clearTimetable(userId)
    ),

    listTimetablePresets: authenticated<'listTimetablePresets'>(sessionService, () =>
      timetableService.listPresets()
    ),

    getTimetablePresetEntries: authenticated<'getTimetablePresetEntries'>(
      sessionService,
      ({ path }) => timetableService.getPresetEntries(path.presetId)
    )
  })
}
