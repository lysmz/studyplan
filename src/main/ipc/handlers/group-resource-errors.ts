import type { ApiDeclaredError, ApiErrorCode, ApiOperationId } from '../../../shared/api'
import { ApiDeclaredResponseError } from '../api-dispatcher'

export function groupResourceError<K extends ApiOperationId>(
  operationId: K,
  response: ApiDeclaredError<K>,
  code: ApiErrorCode,
  message: string
): ApiDeclaredResponseError<K> {
  return new ApiDeclaredResponseError(operationId, response, code, message)
}
