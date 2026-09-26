/** @jsxRuntime automatic */
import assert from 'node:assert/strict'
import test, { type TestContext } from 'node:test'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  useCollaborationGroups,
  useCollaborationInvitations,
  useCollaborationSignIn,
  useCollaborationSignOut,
  useUpdateCollaborationTask
} from '../../src/renderer/src/api/collaboration'
import { CollaborationClientError } from '../../src/renderer/src/collaboration/client'
import type { CollaborationTransport } from '../../src/shared/collaboration/ipc'

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity }
    }
  })
}

function renderHook<T>(queryClient: QueryClient, useHook: () => T): T {
  let result!: T
  function Probe(): null {
    result = useHook()
    return null
  }
  renderToStaticMarkup(
    <QueryClientProvider client={queryClient}>
      <Probe />
    </QueryClientProvider>
  )
  return result
}

function setTransport(context: TestContext, invoke: CollaborationTransport): void {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { collaborationTransport: { invoke } }
  })
  context.after(() => {
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  })
}

test('the overview keeps group and invitation queries disabled before sign-in', () => {
  const queryClient = createQueryClient()
  const queries = renderHook(queryClient, () => ({
    groups: useCollaborationGroups(false),
    invitations: useCollaborationInvitations(false)
  }))
  for (const query of Object.values(queries)) {
    assert.equal(query.isEnabled, false)
    assert.equal(query.fetchStatus, 'idle')
  }
  queryClient.clear()
})

test('sign-in refreshes collaboration data and account switching clears only its cache', async (context) => {
  setTransport(context, (async () => ({ ok: true, data: {} })) as CollaborationTransport)
  const queryClient = createQueryClient()
  const localKey = ['api', 'local-account']
  const groupKey = ['collaboration', 'groups']
  const failureKey = ['collaboration', 'state']
  queryClient.setQueryData(localKey, { name: 'Local account' })
  queryClient.setQueryData(groupKey, [{ id: 'alice-group' }])
  queryClient.setQueryData(failureKey, { uploadFailures: [{ taskId: 'alice-draft' }] })
  let callbacks = 0
  const signIn = renderHook(queryClient, () =>
    useCollaborationSignIn({ onSuccess: () => void callbacks++ })
  )
  await signIn.mutateAsync({ email: 'alice@example.test', password: 'password' })
  assert.equal(queryClient.getQueryState(groupKey)?.isInvalidated, true)
  assert.equal(queryClient.getQueryState(failureKey)?.isInvalidated, true)
  assert.equal(queryClient.getQueryState(localKey)?.isInvalidated, false)

  const signOut = renderHook(queryClient, () =>
    useCollaborationSignOut({ onSuccess: () => void callbacks++ })
  )
  await signOut.mutateAsync({})
  assert.equal(queryClient.getQueryCache().findAll({ queryKey: ['collaboration'] }).length, 0)
  assert.deepEqual(queryClient.getQueryData(localKey), { name: 'Local account' })
  assert.equal(callbacks, 2)
  queryClient.clear()
})

test('task mutations refresh their group, preserve UI callbacks, and surface failed writes', async (context) => {
  let rejectWrite = false
  setTransport(context, (async () =>
    rejectWrite
      ? { ok: false, error: { code: 'FORBIDDEN', message: 'Membership required' } }
      : { ok: true, data: { id: 'task' } }) as CollaborationTransport)
  const queryClient = createQueryClient()
  const taskKey = ['collaboration', 'tasks', 'group-one']
  const otherTaskKey = ['collaboration', 'tasks', 'group-two']
  queryClient.setQueryData(taskKey, [])
  queryClient.setQueryData(otherTaskKey, [])
  let successes = 0
  let failure: CollaborationClientError | undefined
  const update = renderHook(queryClient, () =>
    useUpdateCollaborationTask({
      onSuccess: () => void successes++,
      onError: (error) => {
        failure = error
      }
    })
  )
  const input = { groupId: 'group-one', taskId: 'task', status: 'done' as const }
  await update.mutateAsync(input)
  assert.equal(queryClient.getQueryState(taskKey)?.isInvalidated, true)
  assert.equal(queryClient.getQueryState(otherTaskKey)?.isInvalidated, false)
  assert.equal(successes, 1)

  queryClient.setQueryData(taskKey, [])
  rejectWrite = true
  await assert.rejects(update.mutateAsync(input), { code: 'FORBIDDEN' })
  assert.equal(queryClient.getQueryState(taskKey)?.isInvalidated, false)
  assert.equal(successes, 1)
  assert.equal(failure?.message, 'Membership required')
  queryClient.clear()
})
