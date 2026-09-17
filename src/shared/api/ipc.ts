import type { ApiInput, ApiOperationId, ApiOutput } from './generated/contract.generated'

export const API_INVOKE_CHANNEL = 'api:invoke'

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NOT_IMPLEMENTED'
  | 'INTERNAL_ERROR'

export interface ApiError {
  code: ApiErrorCode
  message: string
  details?: unknown
  requestId?: string
}

export type ApiResult<T> = { ok: true; data: T; requestId: string } | { ok: false; error: ApiError }

export interface ApiInvokeRequest<K extends ApiOperationId = ApiOperationId> {
  operationId: K
  input: ApiInput<K>
  requestId: string
}

export type ApiTransport = <K extends ApiOperationId>(
  operationId: K,
  input: ApiInput<K>
) => Promise<ApiResult<ApiOutput<K>>>

export class ApiClientError extends Error {
  readonly code: ApiErrorCode
  readonly details?: unknown
  readonly requestId?: string

  constructor(error: ApiError) {
    super(error.message)
    this.name = 'ApiClientError'
    this.code = error.code
    this.details = error.details
    this.requestId = error.requestId
  }
}
