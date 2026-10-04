import { randomUUID } from 'node:crypto'
import type { IpcMainInvokeEvent } from 'electron'
import { ipcMain } from 'electron'
import { ZodError } from 'zod'
export { createWindowSenderPolicy, type MutableApiSenderPolicy } from './sender-policy'
import {
  API_INVOKE_CHANNEL,
  operationContracts,
  type ApiDeclaredError,
  type ApiError,
  type ApiErrorCode,
  type ApiInput,
  type ApiOperationId,
  type ApiOutput,
  type ApiResult
} from '../../shared/api'

export interface ApiHandlerContext {
  event: IpcMainInvokeEvent
  requestId: string
}

export type ApiHandler<K extends ApiOperationId> = (
  input: ApiInput<K>,
  context: ApiHandlerContext
) => ApiOutput<K> | Promise<ApiOutput<K>>

export type ApiHandlerRegistry = {
  [K in ApiOperationId]: ApiHandler<K>
}

export type PartialApiHandlerRegistry = {
  [K in ApiOperationId]?: ApiHandler<K>
}

export type ApiSenderPolicy = (event: IpcMainInvokeEvent) => boolean | Promise<boolean>

export interface ApiDispatcherOptions {
  handlers: PartialApiHandlerRegistry
  isSenderAllowed: ApiSenderPolicy
  onError?: (error: unknown, context: { operationId?: string; requestId: string }) => void
}

export function defineApiHandlers(handlers: ApiHandlerRegistry): ApiHandlerRegistry {
  return handlers
}

export function definePartialApiHandlers(
  handlers: PartialApiHandlerRegistry
): PartialApiHandlerRegistry {
  return handlers
}

export class ApiHandlerError extends Error {
  readonly code: ApiErrorCode
  readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiHandlerError'
    this.code = code
    this.details = details
  }
}

export class ApiDeclaredResponseError<K extends ApiOperationId> extends ApiHandlerError {
  constructor(
    readonly operationId: K,
    readonly response: ApiDeclaredError<K>,
    code: ApiErrorCode,
    message: string
  ) {
    super(code, message, response)
    this.name = 'ApiDeclaredResponseError'
  }
}

function failure(requestId: string, error: Omit<ApiError, 'requestId'>): ApiResult<never> {
  let details: unknown
  try {
    details = error.details === undefined ? undefined : structuredClone(error.details)
  } catch {
    details = undefined
  }
  return { ok: false, error: { ...error, details, requestId } }
}

function isInvokeRequest(value: unknown): value is {
  operationId: string
  input: unknown
  requestId?: unknown
} {
  return Boolean(value && typeof value === 'object' && 'operationId' in value && 'input' in value)
}

function issues(error: ZodError): unknown {
  return error.issues.map((issue) => ({
    code: issue.code,
    path: issue.path,
    message: issue.message
  }))
}

export function createApiDispatcher(options: ApiDispatcherOptions) {
  return async (event: IpcMainInvokeEvent, rawRequest: unknown): Promise<ApiResult<unknown>> => {
    const suppliedRequestId =
      isInvokeRequest(rawRequest) && typeof rawRequest.requestId === 'string'
        ? rawRequest.requestId
        : undefined
    const requestId = suppliedRequestId || randomUUID()

    if (!(await options.isSenderAllowed(event))) {
      return failure(requestId, {
        code: 'FORBIDDEN',
        message: 'This renderer is not allowed to use the API.'
      })
    }
    if (!isInvokeRequest(rawRequest) || typeof rawRequest.operationId !== 'string') {
      return failure(requestId, { code: 'VALIDATION_ERROR', message: 'Malformed API request.' })
    }
    if (!Object.hasOwn(operationContracts, rawRequest.operationId)) {
      return failure(requestId, { code: 'NOT_FOUND', message: 'Unknown API operation.' })
    }

    const operationId = rawRequest.operationId as ApiOperationId
    const contract = operationContracts[operationId]
    const parsedInput = contract.input.safeParse(rawRequest.input)
    if (!parsedInput.success) {
      return failure(requestId, {
        code: 'VALIDATION_ERROR',
        message: `Invalid input for ${operationId}.`,
        details: issues(parsedInput.error)
      })
    }

    const handler = options.handlers[operationId] as ApiHandler<typeof operationId> | undefined
    if (!handler) {
      return failure(requestId, {
        code: 'NOT_IMPLEMENTED',
        message: `${operationId} is not implemented in the desktop application.`
      })
    }

    try {
      const output = await handler(parsedInput.data as ApiInput<typeof operationId>, {
        event,
        requestId
      })
      const parsedOutput = contract.output.safeParse(output)
      if (!parsedOutput.success) {
        options.onError?.(parsedOutput.error, { operationId, requestId })
        return failure(requestId, {
          code: 'INTERNAL_ERROR',
          message: 'The operation returned an invalid response.'
        })
      }
      return { ok: true, data: parsedOutput.data, requestId }
    } catch (error) {
      if (error instanceof ApiDeclaredResponseError) {
        const parsedError =
          error.operationId === operationId ? contract.error.safeParse(error.response) : undefined
        if (!parsedError?.success) {
          options.onError?.(error, { operationId, requestId })
          return failure(requestId, {
            code: 'INTERNAL_ERROR',
            message: 'The operation produced an invalid declared error.'
          })
        }
        return failure(requestId, {
          code: error.code,
          message: error.message,
          details: parsedError.data
        })
      }
      if (error instanceof ApiHandlerError) {
        return failure(requestId, {
          code: error.code,
          message: error.message,
          details: error.details
        })
      }
      options.onError?.(error, { operationId, requestId })
      return failure(requestId, {
        code: 'INTERNAL_ERROR',
        message: 'The operation could not be completed.'
      })
    }
  }
}

export function registerApiDispatcher(options: ApiDispatcherOptions): () => void {
  ipcMain.handle(API_INVOKE_CHANNEL, createApiDispatcher(options))
  return () => ipcMain.removeHandler(API_INVOKE_CHANNEL)
}
