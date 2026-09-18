import type { ApiInput, ApiOperationId, ApiOutput } from '../../shared/api'
import { SessionRequiredError, SessionService } from '../auth/session.service'
import { ApiHandlerError, type ApiHandler, type ApiHandlerContext } from './api-dispatcher'

export type AuthenticatedHandler<K extends ApiOperationId> = (
  input: ApiInput<K>,
  userId: number,
  context: ApiHandlerContext
) => ApiOutput<K> | Promise<ApiOutput<K>>

export function authenticated<K extends ApiOperationId>(
  session: SessionService,
  handler: AuthenticatedHandler<K>
): ApiHandler<K> {
  return (input, context) => {
    let userId: number
    try {
      userId = session.requireCurrentUserId()
    } catch (error) {
      if (error instanceof SessionRequiredError) {
        throw new ApiHandlerError('UNAUTHENTICATED', 'Authentication is required.')
      }
      throw error
    }
    return handler(input, userId, context)
  }
}
