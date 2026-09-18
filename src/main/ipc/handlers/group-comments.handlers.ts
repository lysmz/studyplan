import { SessionService } from '../../auth/session.service'
import { GroupMemberRequiredError } from '../../services/group-access.service'
import {
  CommentDeleteForbiddenError,
  GroupCommentNotFoundError,
  GroupCommentsService
} from '../../services/group-comments.service'
import { definePartialApiHandlers, type PartialApiHandlerRegistry } from '../api-dispatcher'
import { authenticated } from '../authenticated'
import { groupResourceError } from './group-resource-errors'

export function createGroupCommentsHandlers(
  comments: GroupCommentsService,
  session: SessionService
): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    deleteComment: authenticated<'deleteComment'>(session, async ({ path }, userId) => {
      try {
        return await comments.deleteComment(userId, path.id)
      } catch (error) {
        if (error instanceof GroupCommentNotFoundError) {
          throw groupResourceError(
            'deleteComment',
            { status: 404, body: { error: 'Kommentar nicht gefunden' } },
            'NOT_FOUND',
            'Group comment not found.'
          )
        }
        if (
          error instanceof GroupMemberRequiredError ||
          error instanceof CommentDeleteForbiddenError
        ) {
          throw groupResourceError(
            'deleteComment',
            { status: 403, body: { error: 'Du darfst diesen Kommentar nicht löschen' } },
            'FORBIDDEN',
            'Only the comment author or group owner may delete this comment.'
          )
        }
        throw error
      }
    })
  })
}
