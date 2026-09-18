import { SessionService } from '../../auth/session.service'
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
  sessionService: SessionService
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    listEvents: authenticated<'listEvents'>(sessionService, ({ query }, userId) =>
      eventsService.listEvents(userId, query)
    ),

    createEvent: authenticated<'createEvent'>(sessionService, ({ body }, userId) =>
      eventsService.createEvent(userId, body)
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
