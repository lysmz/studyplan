import { compare, hash } from 'bcryptjs'
import type { AuthUser, LoginInput, RegisterInput } from '../../shared/api'
import { SessionService } from '../auth/session.service'
import { toSafeUser, UsersRepository } from '../repositories/users.repository'

export const PASSWORD_HASH_ROUNDS = 12

export class DuplicateUsernameError extends Error {
  constructor() {
    super('That username is already registered.')
    this.name = 'DuplicateUsernameError'
  }
}

export class InvalidCredentialsError extends Error {
  constructor() {
    super('The username or password is incorrect.')
    this.name = 'InvalidCredentialsError'
  }
}

export class MissingSessionError extends Error {
  constructor() {
    super('Authentication is required.')
    this.name = 'MissingSessionError'
  }
}

function isUniqueUsernameConstraint(error: unknown): boolean {
  let candidate: unknown = error
  for (let depth = 0; depth < 5 && candidate && typeof candidate === 'object'; depth += 1) {
    const details = candidate as {
      code?: unknown
      extendedCode?: unknown
      message?: unknown
      cause?: unknown
    }
    const code = typeof details.code === 'string' ? details.code : ''
    const extendedCode = typeof details.extendedCode === 'string' ? details.extendedCode : ''
    const message = typeof details.message === 'string' ? details.message : ''
    if (
      (code.includes('SQLITE_CONSTRAINT') || message.includes('UNIQUE constraint failed')) &&
      (extendedCode.includes('UNIQUE') || message.includes('users.username'))
    ) {
      return true
    }
    candidate = details.cause
  }
  return false
}

export class AuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly session: SessionService
  ) {}

  async register(input: RegisterInput): Promise<AuthUser> {
    const username = input.username.trim()
    const displayName = input.displayName.trim()

    if (await this.users.findByUsername(username)) throw new DuplicateUsernameError()

    const passwordHash = await hash(input.password, PASSWORD_HASH_ROUNDS)
    let user
    try {
      user = await this.users.createUser({
        username,
        passwordHash,
        displayName,
        studyProgramId: input.studyProgramId ?? null
      })
    } catch (error) {
      if (isUniqueUsernameConstraint(error)) throw new DuplicateUsernameError()
      throw error
    }

    this.session.start(user.id)
    return toSafeUser(user)
  }

  async login(input: LoginInput): Promise<AuthUser> {
    const user = await this.users.findByUsername(input.username.trim())
    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new InvalidCredentialsError()
    }

    this.session.start(user.id)
    return toSafeUser(user)
  }

  logout(): undefined {
    this.session.clear()
    return undefined
  }

  async getMe(): Promise<AuthUser> {
    const userId = this.session.getCurrentUserId()
    if (userId === null) throw new MissingSessionError()

    const user = await this.users.findById(userId)
    if (!user) {
      this.session.clear()
      throw new MissingSessionError()
    }
    return toSafeUser(user)
  }
}
