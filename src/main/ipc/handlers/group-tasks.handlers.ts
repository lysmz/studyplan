import { SessionService } from '../../auth/session.service'
import { GroupMemberRequiredError } from '../../services/group-access.service'
import {
  GroupTaskNotFoundError,
  GroupTasksService,
  InvalidTaskAssigneeError
} from '../../services/group-tasks.service'
import { GroupCommentsService } from '../../services/group-comments.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'
import { authenticated } from '../authenticated'
import { groupResourceError } from './group-resource-errors'

export function createGroupTasksHandlers(
  tasks: GroupTasksService,
  comments: GroupCommentsService,
  session: SessionService
): PartialApiHandlerRegistry {
  const forbidden = <
    K extends
      | 'listGroupTasks'
      | 'createGroupTask'
      | 'updateGroupTask'
      | 'deleteGroupTask'
      | 'listTaskComments'
      | 'addTaskComment'
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
    listGroupTasks: authenticated<'listGroupTasks'>(session, async ({ path }, userId) => {
      try {
        return await tasks.listTasks(userId, path.id)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('listGroupTasks')
        throw error
      }
    }),
    createGroupTask: authenticated<'createGroupTask'>(session, async ({ path, body }, userId) => {
      try {
        return await tasks.createTask(userId, path.id, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('createGroupTask')
        if (error instanceof InvalidTaskAssigneeError) {
          throw groupResourceError(
            'createGroupTask',
            { status: 400, body: { error: 'Die zugewiesene Person ist kein Gruppenmitglied' } },
            'VALIDATION_ERROR',
            'The task assignee must be a member of the group.'
          )
        }
        throw error
      }
    }),
    updateGroupTask: authenticated<'updateGroupTask'>(session, async ({ path, body }, userId) => {
      try {
        return await tasks.updateTask(userId, path.id, path.taskId, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('updateGroupTask')
        if (error instanceof InvalidTaskAssigneeError) {
          throw groupResourceError(
            'updateGroupTask',
            { status: 400, body: { error: 'Die zugewiesene Person ist kein Gruppenmitglied' } },
            'VALIDATION_ERROR',
            'The task assignee must be a member of the group.'
          )
        }
        if (error instanceof GroupTaskNotFoundError) {
          throw groupResourceError(
            'updateGroupTask',
            { status: 404, body: { error: 'Aufgabe nicht gefunden' } },
            'NOT_FOUND',
            'Group task not found.'
          )
        }
        throw error
      }
    }),
    deleteGroupTask: authenticated<'deleteGroupTask'>(session, async ({ path }, userId) => {
      try {
        return await tasks.deleteTask(userId, path.id, path.taskId)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('deleteGroupTask')
        if (error instanceof GroupTaskNotFoundError) {
          throw groupResourceError(
            'deleteGroupTask',
            { status: 404, body: { error: 'Aufgabe nicht gefunden' } },
            'NOT_FOUND',
            'Group task not found.'
          )
        }
        throw error
      }
    }),
    listTaskComments: authenticated<'listTaskComments'>(session, async ({ path }, userId) => {
      try {
        return await comments.listComments(userId, path.id, 'task', path.taskId)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('listTaskComments')
        if (error instanceof GroupTaskNotFoundError) {
          throw groupResourceError(
            'listTaskComments',
            { status: 404, body: { error: 'Aufgabe nicht gefunden' } },
            'NOT_FOUND',
            'Group task not found.'
          )
        }
        throw error
      }
    }),
    addTaskComment: authenticated<'addTaskComment'>(session, async ({ path, body }, userId) => {
      try {
        return await comments.addComment(userId, path.id, 'task', path.taskId, body)
      } catch (error) {
        if (error instanceof GroupMemberRequiredError) throw forbidden('addTaskComment')
        if (error instanceof GroupTaskNotFoundError) {
          throw groupResourceError(
            'addTaskComment',
            { status: 404, body: { error: 'Aufgabe nicht gefunden' } },
            'NOT_FOUND',
            'Group task not found.'
          )
        }
        throw error
      }
    })
  })
}
