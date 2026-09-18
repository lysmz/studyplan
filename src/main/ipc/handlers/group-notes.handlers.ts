import { SessionService } from '../../auth/session.service'
import { GroupMemberRequiredError } from '../../services/group-access.service'
import { GroupNoteNotFoundError, GroupNotesService } from '../../services/group-notes.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'
import { authenticated } from '../authenticated'
import { groupResourceError } from './group-resource-errors'

export function createGroupNotesHandlers(
  notes: GroupNotesService,
  session: SessionService
): PartialApiHandlerRegistry {
  const forbidden = <
    K extends 'listGroupNotes' | 'createGroupNote' | 'updateGroupNote' | 'deleteGroupNote'
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
    listGroupNotes: authenticated<'listGroupNotes'>(session, async ({ path }, userId) => {
      try {
        return await notes.listNotes(userId, path.id)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('listGroupNotes')
        throw error
      }
    }),
    createGroupNote: authenticated<'createGroupNote'>(session, async ({ path, body }, userId) => {
      try {
        return await notes.createNote(userId, path.id, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('createGroupNote')
        throw error
      }
    }),
    updateGroupNote: authenticated<'updateGroupNote'>(session, async ({ path, body }, userId) => {
      try {
        return await notes.updateNote(userId, path.id, path.noteId, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('updateGroupNote')
        if (error instanceof GroupNoteNotFoundError) {
          throw groupResourceError(
            'updateGroupNote',
            { status: 404, body: { error: 'Notiz nicht gefunden' } },
            'NOT_FOUND',
            'Group note not found.'
          )
        }
        throw error
      }
    }),
    deleteGroupNote: authenticated<'deleteGroupNote'>(session, async ({ path }, userId) => {
      try {
        return await notes.deleteNote(userId, path.id, path.noteId)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('deleteGroupNote')
        if (error instanceof GroupNoteNotFoundError) {
          throw groupResourceError(
            'deleteGroupNote',
            { status: 404, body: { error: 'Notiz nicht gefunden' } },
            'NOT_FOUND',
            'Group note not found.'
          )
        }
        throw error
      }
    })
  })
}
