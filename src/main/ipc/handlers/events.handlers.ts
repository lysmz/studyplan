import { SessionService } from '../../auth/session.service'
import { InvalidIcalFileError, type IcalFilePicker } from '../../files/ical-file-picker'
import { InvalidEventsIcalError } from '../../services/events-ical.parser'
import { EventNotFoundError, EventsService } from '../../services/events.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'
import { authenticated } from '../authenticated'

type EventNotFoundOperation = 'getEvent' | 'updateEvent' | 'deleteEvent'

function notFound(
  operationId: EventNotFoundOperation
): ApiDeclaredResponseError<EventNotFoundOperation> {
  return new ApiDeclaredResponseError(
    operationId,
    { status: 404, body: { error: 'Termin nicht gefunden' } },
    'NOT_FOUND',
    'Event not found.'
  )
}

export function createEventsHandlers(
  eventsService: EventsService,
  sessionService: SessionService,
  icalFilePicker: IcalFilePicker
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    listEvents: authenticated<'listEvents'>(sessionService, ({ query }, userId) =>
      eventsService.listEvents(userId, query)
    ),

    createEvent: authenticated<'createEvent'>(sessionService, ({ body }, userId) =>
      eventsService.createEvent(userId, body)
    ),

    importEventsIcal: authenticated<'importEventsIcal'>(
      sessionService,
      async (_input, userId, context) => {
        try {
          const selection = await icalFilePicker.selectIcalFile(context.event)
          if (selection.status === 'cancelled') {
            return { status: 'cancelled', importedCount: 0, skippedCount: 0 }
          }
          return await eventsService.importEventsIcal(userId, selection.contents)
        } catch (error) {
          if (error instanceof InvalidIcalFileError || error instanceof InvalidEventsIcalError) {
            throw new ApiDeclaredResponseError(
              'importEventsIcal',
              { status: 400, body: { error: error.message } },
              'VALIDATION_ERROR',
              error.message
            )
          }
          throw error
        }
      }
    ),

    getEvent: authenticated<'getEvent'>(sessionService, async ({ path }, userId) => {
      try {
        return await eventsService.getEvent(userId, path.id)
      } catch (error) {
        if (error instanceof EventNotFoundError) throw notFound('getEvent')
        throw error
      }
    }),

    updateEvent: authenticated<'updateEvent'>(sessionService, async ({ path, body }, userId) => {
      try {
        return await eventsService.updateEvent(userId, path.id, body)
      } catch (error) {
        if (error instanceof EventNotFoundError) throw notFound('updateEvent')
        throw error
      }
    }),

    deleteEvent: authenticated<'deleteEvent'>(sessionService, async ({ path }, userId) => {
      try {
        return await eventsService.deleteEvent(userId, path.id)
      } catch (error) {
        if (error instanceof EventNotFoundError) throw notFound('deleteEvent')
        throw error
      }
    })
  })
}
