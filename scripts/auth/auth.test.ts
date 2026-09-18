import assert from 'node:assert/strict'
import test from 'node:test'
import { compare } from 'bcryptjs'
import { createClient, type Client } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import {
  ApiClientError,
  createApiClient,
  type ApiInput,
  type ApiOperationId,
  type ApiOutput,
  type ApiResult,
  type ApiTransport
} from '../../src/shared/api'
import * as schema from '../../src/main/db/schema'
import { SessionService } from '../../src/main/auth/session.service'
import { UsersRepository } from '../../src/main/repositories/users.repository'
import { AuthService, DuplicateUsernameError } from '../../src/main/services/auth.service'
import { createAuthHandlers } from '../../src/main/ipc/handlers/auth.handlers'
import {
  ApiHandlerError,
  createApiDispatcher,
  definePartialApiHandlers,
  type ApiHandlerContext
} from '../../src/main/ipc/api-dispatcher'
import { authenticated } from '../../src/main/ipc/authenticated'
import { getGetMeQueryOptions } from '../../src/renderer/src/api/generated/react-query.generated'

interface TestContext {
  client: Client
  users: UsersRepository
  session: SessionService
  auth: AuthService
  api: ReturnType<typeof createApiClient>
  transport: ApiTransport
  dispatch: ReturnType<typeof createApiDispatcher>
}

async function createTestContext(): Promise<TestContext> {
  const client = createClient({ url: 'file::memory:' })
  await client.execute(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      study_program_id INTEGER,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `)
  const database = drizzle(client, { schema })
  const users = new UsersRepository(database)
  const session = new SessionService()
  const auth = new AuthService(users, session)
  const dispatch = createApiDispatcher({
    handlers: createAuthHandlers(auth),
    isSenderAllowed: () => true
  })
  const transport: ApiTransport = async <K extends ApiOperationId>(
    operationId: K,
    input: ApiInput<K>
  ): Promise<ApiResult<ApiOutput<K>>> =>
    (await dispatch({} as never, {
      operationId,
      input,
      requestId: `test-${operationId}`
    })) as ApiResult<ApiOutput<K>>

  return { client, users, session, auth, api: createApiClient(transport), transport, dispatch }
}

const registration = {
  username: 'student',
  password: 'correct horse battery staple',
  displayName: 'Student Name'
}

test('registration hashes the password, authenticates, and never exposes the hash', async () => {
  const context = await createTestContext()
  try {
    const user = await context.auth.register(registration)
    const stored = await context.users.findByUsername(registration.username)

    assert.ok(stored)
    assert.notEqual(stored.passwordHash, registration.password)
    assert.equal(await compare(registration.password, stored.passwordHash), true)
    assert.equal(context.session.getCurrentUserId(), user.id)
    assert.equal(Object.hasOwn(user, 'passwordHash'), false)

    context.auth.logout()
    const ipcUser = await context.api.auth.login({ body: registration })
    assert.equal(Object.hasOwn(ipcUser, 'passwordHash'), false)
  } finally {
    context.client.close()
  }
})

test('duplicate usernames, including a registration race, produce CONFLICT', async () => {
  const context = await createTestContext()
  try {
    const attempts = await Promise.allSettled([
      context.auth.register(registration),
      context.auth.register(registration)
    ])
    assert.equal(attempts.filter(({ status }) => status === 'fulfilled').length, 1)
    const rejected = attempts.find(({ status }) => status === 'rejected')
    assert.ok(rejected && rejected.status === 'rejected')
    assert.ok(rejected.reason instanceof DuplicateUsernameError)

    const result = await context.dispatch({} as never, {
      operationId: 'register',
      input: { body: registration },
      requestId: 'duplicate-registration'
    })
    assert.equal(result.ok, false)
    if (!result.ok) {
      assert.equal(result.error.code, 'CONFLICT')
      assert.deepEqual(result.error.details, {
        status: 409,
        body: { error: 'That username is already registered.' }
      })
    }
  } finally {
    context.client.close()
  }
})

test('wrong passwords and unknown usernames share the same authentication failure', async () => {
  const context = await createTestContext()
  try {
    await context.auth.register(registration)
    context.auth.logout()

    const failures: ApiClientError[] = []
    for (const input of [
      { username: registration.username, password: 'wrong password' },
      { username: 'unknown-user', password: 'wrong password' }
    ]) {
      try {
        await context.api.auth.login({ body: input })
        assert.fail('Login should have failed.')
      } catch (error) {
        assert.ok(error instanceof ApiClientError)
        assert.equal(error.code, 'UNAUTHENTICATED')
        assert.deepEqual(error.details, {
          status: 401,
          body: { error: 'The username or password is incorrect.' }
        })
        failures.push(error)
      }
    }
    assert.equal(failures[0].message, failures[1].message)
  } finally {
    context.client.close()
  }
})

test('logout clears the session and a new session starts logged out', async () => {
  const context = await createTestContext()
  try {
    await context.api.auth.register({ body: registration })
    assert.ok(await context.api.auth.getMe({}))
    assert.equal(await context.api.auth.logout({}), undefined)
    assert.equal(await context.api.auth.logout({}), undefined)
    await assert.rejects(
      () => context.api.auth.getMe({}),
      (error: unknown) => error instanceof ApiClientError && error.code === 'UNAUTHENTICATED'
    )
    assert.equal(new SessionService().getCurrentUserId(), null)
  } finally {
    context.client.close()
  }
})

test('getMe clears a session whose user no longer exists', async () => {
  const context = await createTestContext()
  try {
    const user = await context.auth.register(registration)
    await context.client.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [user.id] })

    await assert.rejects(
      () => context.api.auth.getMe({}),
      (error: unknown) => error instanceof ApiClientError && error.code === 'UNAUTHENTICATED'
    )
    assert.equal(context.session.getCurrentUserId(), null)
  } finally {
    context.client.close()
  }
})

test('protected handlers trust the session user and reject renderer-supplied identities', async () => {
  const session = new SessionService()
  let receivedUserId: number | undefined
  const handler = authenticated<'getDashboardStats'>(session, (_input, userId) => {
    receivedUserId = userId
    return { gpa: null, totalEcts: 0, upcomingDeadlinesCount: 0, gradesCount: 0 }
  })
  const dispatch = createApiDispatcher({
    handlers: definePartialApiHandlers({ getDashboardStats: handler }),
    isSenderAllowed: () => true
  })

  const unauthenticated = await dispatch({} as never, {
    operationId: 'getDashboardStats',
    input: {},
    requestId: 'protected-no-session'
  })
  assert.equal(unauthenticated.ok, false)
  if (!unauthenticated.ok) assert.equal(unauthenticated.error.code, 'UNAUTHENTICATED')

  session.start(7)
  const spoofed = await dispatch({} as never, {
    operationId: 'getDashboardStats',
    input: { userId: 99 },
    requestId: 'protected-spoofed-user'
  })
  assert.equal(spoofed.ok, false)
  if (!spoofed.ok) assert.equal(spoofed.error.code, 'VALIDATION_ERROR')

  const valid = await handler({}, {} as ApiHandlerContext)
  assert.equal(receivedUserId, 7)
  assert.deepEqual(valid, { gpa: null, totalEcts: 0, upcomingDeadlinesCount: 0, gradesCount: 0 })
})

test('the renderer transport reconstructs UNAUTHENTICATED as ApiClientError', async () => {
  const context = await createTestContext()
  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { apiTransport: { invoke: context.transport } }
    })
    const queryFn = getGetMeQueryOptions().queryFn
    assert.equal(typeof queryFn, 'function')
    if (typeof queryFn !== 'function') return

    await assert.rejects(
      async () => queryFn({} as never),
      (error: unknown) => error instanceof ApiClientError && error.code === 'UNAUTHENTICATED'
    )
  } finally {
    context.client.close()
  }
})

test('the authenticated wrapper throws a structured handler error without a session', () => {
  const handler = authenticated<'getDashboardStats'>(new SessionService(), () => ({
    gpa: null,
    totalEcts: 0,
    upcomingDeadlinesCount: 0,
    gradesCount: 0
  }))
  assert.throws(
    () => handler({}, {} as ApiHandlerContext),
    (error: unknown) => error instanceof ApiHandlerError && error.code === 'UNAUTHENTICATED'
  )
})
