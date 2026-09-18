import {
  AuthService,
  DuplicateUsernameError,
  InvalidCredentialsError,
  MissingSessionError
} from '../../services/auth.service'
import {
  ApiDeclaredResponseError,
  definePartialApiHandlers,
  type PartialApiHandlerRegistry
} from '../api-dispatcher'

export function createAuthHandlers(authService: AuthService): PartialApiHandlerRegistry {
  return definePartialApiHandlers({
    async register({ body }) {
      try {
        return await authService.register(body)
      } catch (error) {
        if (error instanceof DuplicateUsernameError) {
          throw new ApiDeclaredResponseError(
            'register',
            { status: 409, body: { error: 'That username is already registered.' } },
            'CONFLICT',
            'That username is already registered.'
          )
        }
        throw error
      }
    },

    async login({ body }) {
      try {
        return await authService.login(body)
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          throw new ApiDeclaredResponseError(
            'login',
            { status: 401, body: { error: 'The username or password is incorrect.' } },
            'UNAUTHENTICATED',
            'The username or password is incorrect.'
          )
        }
        throw error
      }
    },

    logout() {
      return authService.logout()
    },

    async getMe() {
      try {
        return await authService.getMe()
      } catch (error) {
        if (error instanceof MissingSessionError) {
          throw new ApiDeclaredResponseError(
            'getMe',
            { status: 401, body: { error: 'Authentication is required.' } },
            'UNAUTHENTICATED',
            'Authentication is required.'
          )
        }
        throw error
      }
    }
  })
}
