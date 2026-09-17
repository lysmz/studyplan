import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import test from 'node:test'
import { parse } from 'yaml'
import {
  OperationCreateEventInputSchema,
  OperationGetEventInputSchema,
  OperationListEventsInputSchema,
  OperationLogoutOutputSchema,
  OperationUpdateEventInputSchema,
  operationContracts,
  type OperationGetEventInput,
  type OperationListEventsInput,
  type OperationLogoutOutput,
  type OperationUpdateEventInput
} from '../../src/shared/api/generated/contract.generated'
import { buildGeneratedFiles } from './generator-lib'
import {
  ApiDeclaredResponseError,
  createApiDispatcher,
  definePartialApiHandlers
} from '../../src/main/ipc/api-dispatcher'

function operationIdsFromDocument(document: Record<string, unknown>): string[] {
  const ids: string[] = []
  const paths = document.paths as Record<string, Record<string, unknown>>
  for (const pathItem of Object.values(paths)) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']) {
      const operation = pathItem[method] as { operationId?: string } | undefined
      if (operation?.operationId) ids.push(operation.operationId)
    }
  }
  return ids
}

test('every OpenAPI operationId is represented exactly once', async () => {
  const document = parse(await readFile('api/openapi.yaml', 'utf8')) as Record<string, unknown>
  const contractIds = Object.keys(operationContracts).sort()
  const sourceIds = operationIdsFromDocument(document).sort()
  assert.deepEqual(contractIds, sourceIds)
  assert.equal(new Set(sourceIds).size, sourceIds.length)
})

test('generation is deterministic and checked-in files are current', async () => {
  const first = await buildGeneratedFiles()
  const second = await buildGeneratedFiles()
  assert.deepEqual(first, second)
  for (const file of first) {
    assert.equal(
      await readFile(file.path, 'utf8'),
      file.content,
      `${relative(process.cwd(), file.path)} is stale`
    )
  }
})

test('representative path, query, and body inputs validate', () => {
  assert.deepEqual(OperationGetEventInputSchema.parse({ path: { id: 42 } }), { path: { id: 42 } })
  assert.deepEqual(OperationListEventsInputSchema.parse({ query: { month: 9, type: 'exam' } }), {
    query: { month: 9, type: 'exam' }
  })
  assert.equal(
    OperationCreateEventInputSchema.safeParse({
      body: {
        title: 'Exam',
        startDate: new Date('2026-09-17T08:00:00Z'),
        endDate: new Date('2026-09-17T10:00:00Z'),
        type: 'exam',
        importance: 'high'
      }
    }).success,
    true
  )
  assert.equal(
    OperationCreateEventInputSchema.safeParse({
      body: {
        title: 'Exam',
        startDate: '2026-09-17T08:00:00Z',
        endDate: '2026-09-17T10:00:00Z',
        type: 'exam',
        importance: 'high'
      }
    }).success,
    false
  )
  assert.equal(
    OperationUpdateEventInputSchema.safeParse({ path: { id: 42 }, body: { title: 'Updated' } })
      .success,
    true
  )
})

test('no-content output is undefined', () => {
  assert.equal(OperationLogoutOutputSchema.safeParse(undefined).success, true)
  assert.equal(OperationLogoutOutputSchema.safeParse(null).success, false)
})

test('malformed IPC input is rejected at runtime', async () => {
  assert.equal(OperationGetEventInputSchema.safeParse({ path: { id: '42' } }).success, false)
  assert.equal(OperationGetEventInputSchema.safeParse({}).success, false)
  assert.equal(
    OperationListEventsInputSchema.safeParse({ query: { month: 'September' } }).success,
    false
  )
  assert.equal(
    OperationUpdateEventInputSchema.safeParse({ path: { id: 1 }, body: { title: '' } }).success,
    false
  )

  let handlerCalled = false
  const dispatch = createApiDispatcher({
    handlers: definePartialApiHandlers({
      getEvent: () => {
        handlerCalled = true
        throw new Error('must not run')
      }
    }),
    isSenderAllowed: () => true
  })
  const result = await dispatch({} as never, {
    operationId: 'getEvent',
    input: { path: { id: '42' } },
    requestId: 'malformed-input-test'
  })
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error.code, 'VALIDATION_ERROR')
  assert.equal(handlerCalled, false)

  const inheritedKeyResult = await dispatch({} as never, {
    operationId: 'toString',
    input: {},
    requestId: 'inherited-key-test'
  })
  assert.equal(inheritedKeyResult.ok, false)
  if (!inheritedKeyResult.ok) assert.equal(inheritedKeyResult.error.code, 'NOT_FOUND')
})

test('declared operation errors are validated and serialized', async () => {
  const dispatch = createApiDispatcher({
    handlers: definePartialApiHandlers({
      getEvent: () => {
        throw new ApiDeclaredResponseError(
          'getEvent',
          { status: 404, body: { error: 'Missing' } },
          'NOT_FOUND',
          'Event not found.'
        )
      }
    }),
    isSenderAllowed: () => true
  })
  const result = await dispatch({} as never, {
    operationId: 'getEvent',
    input: { path: { id: 404 } },
    requestId: 'declared-error-test'
  })
  assert.deepEqual(result, {
    ok: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Event not found.',
      details: { status: 404, body: { error: 'Missing' } },
      requestId: 'declared-error-test'
    }
  })
})

// Compile-time contract checks for the representative operation shapes above.
const pathInput: OperationGetEventInput = { path: { id: 1 } }
const queryInput: OperationListEventsInput = { query: { year: 2026 } }
const bodyInput: OperationUpdateEventInput = { path: { id: 1 }, body: { title: 'Changed' } }
const noContent: OperationLogoutOutput = undefined
void [pathInput, queryInput, bodyInput, noContent]

// @ts-expect-error path is required
const missingPath: OperationGetEventInput = {}
// @ts-expect-error no-content operations resolve to undefined
const invalidNoContent: OperationLogoutOutput = null
void [missingPath, invalidNoContent]
