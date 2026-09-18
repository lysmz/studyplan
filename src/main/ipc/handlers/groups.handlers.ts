import { SessionService } from '../../auth/session.service'
import {
  GroupNotFoundError,
  GroupOwnerRequiredError,
  GroupsService
} from '../../services/groups.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'
import { authenticated } from '../authenticated'

type GroupNotFoundOperation = 'getGroup' | 'updateGroup'

function notFound(
  operationId: GroupNotFoundOperation
): ApiDeclaredResponseError<GroupNotFoundOperation> {
  return new ApiDeclaredResponseError(
    operationId,
    { status: 404, body: { error: 'Gruppe nicht gefunden' } },
    'NOT_FOUND',
    'Study group not found.'
  )
}

export function createGroupHandlers(
  groupsService: GroupsService,
  sessionService: SessionService
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    listGroups: authenticated<'listGroups'>(sessionService, (_input, userId) =>
      groupsService.listGroups(userId)
    ),

    createGroup: authenticated<'createGroup'>(sessionService, ({ body }, userId) =>
      groupsService.createGroup(userId, body)
    ),

    getGroup: authenticated<'getGroup'>(sessionService, async ({ path }, userId) => {
      try {
        return await groupsService.getGroup(userId, path.id)
      } catch (error) {
        if (error instanceof GroupNotFoundError) throw notFound('getGroup')
        throw error
      }
    }),

    updateGroup: authenticated<'updateGroup'>(sessionService, async ({ path, body }, userId) => {
      try {
        return await groupsService.updateGroup(userId, path.id, body)
      } catch (error) {
        if (error instanceof GroupNotFoundError) throw notFound('updateGroup')
        if (error instanceof GroupOwnerRequiredError) {
          throw new ApiDeclaredResponseError(
            'updateGroup',
            { status: 403, body: { error: 'Nur der Besitzer darf die Gruppe bearbeiten' } },
            'FORBIDDEN',
            'Only the group owner may update this study group.'
          )
        }
        throw error
      }
    })
  })
}
