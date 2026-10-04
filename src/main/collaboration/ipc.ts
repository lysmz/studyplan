import { ipcMain } from 'electron'
import { z } from 'zod'
import type { CollaborationResult } from '../../shared/collaboration/ipc'
import { COLLABORATION_INVOKE_CHANNEL } from '../../shared/collaboration/ipc'
import type { ApiSenderPolicy } from '../ipc/api-dispatcher'
import type { SessionService } from '../auth/session.service'
import { CollaborationOnlineRequiredError } from './online-gateway'
import {
  CollaborationMembershipRequiredError,
  CollaborationRuntime,
  CollaborationSessionRequiredError
} from './runtime'

const id = z.uuid()
const empty = z.object({}).strict()
const optionalDescription = z.string().max(2000).optional()
const optionalTaskDescription = z.string().max(4000).nullable().optional()
const optionalDate = z.iso.datetime({ offset: true }).nullable().optional()
const optionalAssignee = id.nullable().optional()
const inputSchemas = {
  state: empty,
  signIn: z.object({ email: z.email(), password: z.string().min(1) }).strict(),
  signOut: empty,
  listGroups: empty,
  createGroup: z
    .object({ name: z.string().trim().min(1).max(120), description: optionalDescription })
    .strict(),
  getGroup: z.object({ groupId: id }).strict(),
  listMembers: z.object({ groupId: id }).strict(),
  searchCandidates: z.object({ groupId: id, query: z.string().trim().min(2).max(80) }).strict(),
  sendInvitation: z.object({ groupId: id, inviteeId: id }).strict(),
  listInvitations: empty,
  respondInvitation: z
    .object({ invitationId: id, response: z.enum(['accepted', 'declined']) })
    .strict(),
  listTasks: z.object({ groupId: id }).strict(),
  createTask: z
    .object({
      groupId: id,
      title: z.string().trim().min(1).max(200),
      description: optionalTaskDescription,
      dueDate: optionalDate,
      assigneeId: optionalAssignee
    })
    .strict(),
  updateTask: z
    .object({
      groupId: id,
      taskId: id,
      title: z.string().trim().min(1).max(200).optional(),
      description: optionalTaskDescription,
      dueDate: optionalDate,
      assigneeId: optionalAssignee,
      status: z.enum(['open', 'done']).optional()
    })
    .strict(),
  deleteTask: z.object({ groupId: id, taskId: id }).strict()
} as const

type Operation = keyof typeof inputSchemas

function isOperation(value: unknown): value is Operation {
  return typeof value === 'string' && Object.hasOwn(inputSchemas, value)
}

function errorResult(
  code: 'INVALID' | 'UNAUTHENTICATED' | 'OFFLINE' | 'FORBIDDEN' | 'FAILED',
  message: string
): CollaborationResult<never> {
  return { ok: false, error: { code, message } }
}

export function registerCollaborationIpc(
  runtime: CollaborationRuntime,
  isSenderAllowed: ApiSenderPolicy,
  localSession: SessionService
): () => void {
  let boundLocalUserId: number | null = null
  ipcMain.handle(COLLABORATION_INVOKE_CHANNEL, async (event, request: unknown) => {
    if (!(await isSenderAllowed(event))) {
      return errorResult('FORBIDDEN', 'This window cannot use collaboration features.')
    }
    if (!request || typeof request !== 'object') {
      return errorResult('INVALID', 'Malformed collaboration request.')
    }
    const candidate = request as { operation?: unknown; input?: unknown }
    if (!isOperation(candidate.operation)) {
      return errorResult('INVALID', 'Unknown collaboration operation.')
    }
    const parsed = inputSchemas[candidate.operation].safeParse(candidate.input)
    if (!parsed.success) {
      return errorResult('INVALID', 'Invalid collaboration input.')
    }

    const localUserId = localSession.getCurrentUserId()
    if (localUserId === null) {
      if (boundLocalUserId !== null) {
        await runtime.signOut().catch(() => undefined)
        boundLocalUserId = null
      }
      return errorResult('UNAUTHENTICATED', 'Sign in to StudyPlan first.')
    }
    if (boundLocalUserId !== null && boundLocalUserId !== localUserId) {
      await runtime.signOut().catch(() => undefined)
      boundLocalUserId = null
    }

    try {
      const input = parsed.data
      let data: unknown
      switch (candidate.operation) {
        case 'state':
          data = await runtime.state()
          break
        case 'signIn': {
          const values = inputSchemas.signIn.parse(input)
          data = await runtime.signIn(values.email, values.password)
          boundLocalUserId = localUserId
          break
        }
        case 'signOut':
          data = await runtime.signOut()
          boundLocalUserId = null
          break
        case 'listGroups':
          data = await runtime.listGroups()
          break
        case 'createGroup': {
          const values = inputSchemas.createGroup.parse(input)
          data = await runtime.createGroup(values.name, values.description)
          break
        }
        case 'getGroup': {
          const values = inputSchemas.getGroup.parse(input)
          data = await runtime.getGroup(values.groupId)
          break
        }
        case 'listMembers': {
          const values = inputSchemas.listMembers.parse(input)
          data = await runtime.listMembers(values.groupId)
          break
        }
        case 'searchCandidates': {
          const values = inputSchemas.searchCandidates.parse(input)
          data = await runtime.searchCandidates(values.groupId, values.query)
          break
        }
        case 'sendInvitation': {
          const values = inputSchemas.sendInvitation.parse(input)
          data = await runtime.sendInvitation(values.groupId, values.inviteeId)
          break
        }
        case 'listInvitations':
          data = await runtime.listInvitations()
          break
        case 'respondInvitation': {
          const values = inputSchemas.respondInvitation.parse(input)
          data = await runtime.respondInvitation(values.invitationId, values.response)
          break
        }
        case 'listTasks': {
          const values = inputSchemas.listTasks.parse(input)
          data = await runtime.listTasks(values.groupId)
          break
        }
        case 'createTask': {
          const values = inputSchemas.createTask.parse(input)
          data = await runtime.createTask({
            ...values,
            dueDate: values.dueDate ? new Date(values.dueDate) : null
          })
          break
        }
        case 'updateTask': {
          const values = inputSchemas.updateTask.parse(input)
          data = await runtime.updateTask(values.taskId, values.groupId, {
            title: values.title,
            description: values.description,
            dueDate:
              values.dueDate === undefined
                ? undefined
                : values.dueDate === null
                  ? null
                  : new Date(values.dueDate),
            assigneeId: values.assigneeId,
            status: values.status
          })
          break
        }
        case 'deleteTask': {
          const values = inputSchemas.deleteTask.parse(input)
          data = await runtime.deleteTask(values.taskId, values.groupId)
          break
        }
      }
      return { ok: true, data }
    } catch (error) {
      if (error instanceof CollaborationSessionRequiredError) {
        return errorResult('UNAUTHENTICATED', error.message)
      }
      if (error instanceof CollaborationMembershipRequiredError) {
        return errorResult('FORBIDDEN', error.message)
      }
      if (error instanceof CollaborationOnlineRequiredError) {
        return errorResult('OFFLINE', error.message)
      }
      return errorResult('FAILED', error instanceof Error ? error.message : 'Operation failed.')
    }
  })
  return () => ipcMain.removeHandler(COLLABORATION_INVOKE_CHANNEL)
}
