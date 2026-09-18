import { SessionService } from '../../auth/session.service'
import { GroupMemberRequiredError } from '../../services/group-access.service'
import { GroupEventNotFoundError, GroupEventsService } from '../../services/group-events.service'
import { GroupCommentsService } from '../../services/group-comments.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'
import { authenticated } from '../authenticated'
import { groupResourceError } from './group-resource-errors'

export function createGroupEventsHandlers(
  events: GroupEventsService,
  comments: GroupCommentsService,
  session: SessionService
): PartialApiHandlerRegistry {
  const forbidden = <
    K extends
      | 'listGroupEvents'
      | 'createGroupEvent'
      | 'updateGroupEvent'
      | 'deleteGroupEvent'
      | 'listEventComments'
      | 'addEventComment'
  >(
    operationId: K
  ): ApiDeclaredResponseError<K> =>
    groupResourceError(
      operationId,
      { status: 403, body: { error: 'Du bist kein Mitglied dieser Gruppe' } },
      'FORBIDDEN',
      'Group membership is required.'
    )

  return definePartialApiHandlers({
    listGroupEvents: authenticated<'listGroupEvents'>(session, async ({ path }, userId) => {
      try {
        return await events.listEvents(userId, path.id)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('listGroupEvents')
        throw error
      }
    }),
    createGroupEvent: authenticated<'createGroupEvent'>(session, async ({ path, body }, userId) => {
      try {
        return await events.createEvent(userId, path.id, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('createGroupEvent')
        throw error
      }
    }),
    updateGroupEvent: authenticated<'updateGroupEvent'>(session, async ({ path, body }, userId) => {
      try {
        return await events.updateEvent(userId, path.id, path.eventId, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('updateGroupEvent')
        if (error instanceof GroupEventNotFoundError) {
          throw groupResourceError(
            'updateGroupEvent',
            { status: 404, body: { error: 'Termin nicht gefunden' } },
            'NOT_FOUND',
            'Group event not found.'
          )
        }
        throw error
      }
    }),
    deleteGroupEvent: authenticated<'deleteGroupEvent'>(session, async ({ path }, userId) => {
      try {
        return await events.deleteEvent(userId, path.id, path.eventId)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('deleteGroupEvent')
        if (error instanceof GroupEventNotFoundError) {
          throw groupResourceError(
            'deleteGroupEvent',
            { status: 404, body: { error: 'Termin nicht gefunden' } },
            'NOT_FOUND',
            'Group event not found.'
          )
        }
        throw error
      }
    }),
    listEventComments: authenticated<'listEventComments'>(session, async ({ path }, userId) => {
      try {
        return await comments.listComments(userId, path.id, 'event', path.eventId)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('listEventComments')
        if (error instanceof GroupEventNotFoundError) {
          throw groupResourceError(
            'listEventComments',
            { status: 404, body: { error: 'Termin nicht gefunden' } },
            'NOT_FOUND',
            'Group event not found.'
          )
        }
        throw error
      }
    }),
    addEventComment: authenticated<'addEventComment'>(session, async ({ path, body }, userId) => {
      try {
        return await comments.addComment(userId, path.id, 'event', path.eventId, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('addEventComment')
        if (error instanceof GroupEventNotFoundError) {
          throw groupResourceError(
            'addEventComment',
            { status: 404, body: { error: 'Termin nicht gefunden' } },
            'NOT_FOUND',
            'Group event not found.'
          )
        }
        throw error
      }
    })
  })
}
