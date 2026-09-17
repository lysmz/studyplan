import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { format } from 'prettier'
import { parse } from 'yaml'
import { ipcGeneratorConfig } from '../../api/ipc-generator.config'

type JsonObject = Record<string, unknown>

interface Operation {
  id: string
  typeName: string
  tag: string
  method: string
  path: string
  inputSchema: JsonObject
  outputSchema: JsonObject | undefined
  errors: Array<{ status: number | 'default'; schema: JsonObject | undefined }>
  inputRequired: boolean
}

export interface GeneratedFile {
  path: string
  content: string
}

const GENERATED_HEADER = `/**
 * GENERATED FILE - DO NOT EDIT.
 * Source: api/openapi.yaml
 * Run \`npm run api:generate\` to regenerate.
 */`

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'] as const

function asObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} must be an object`)
  }
  return value as JsonObject
}

function identifier(value: string): string {
  const normalized = value.replace(/[^A-Za-z0-9_$]/g, '_')
  return /^[A-Za-z_$]/.test(normalized) ? normalized : `_${normalized}`
}

function pascalCase(value: string): string {
  const result = value
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((part) => `${part[0].toUpperCase()}${part.slice(1)}`)
    .join('')
  return identifier(result || 'Anonymous')
}

function resolvePointer(document: JsonObject, pointer: string): unknown {
  if (!pointer.startsWith('#/')) throw new Error(`Only local references are supported: ${pointer}`)
  return pointer
    .slice(2)
    .split('/')
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
    .reduce<unknown>((current, part) => asObject(current, pointer)[part], document)
}

function dereference(document: JsonObject, value: unknown): JsonObject {
  const object = asObject(value, 'OpenAPI reference target')
  return typeof object.$ref === 'string'
    ? asObject(resolvePointer(document, object.$ref), object.$ref)
    : object
}

function schemaReferences(schema: unknown, references = new Set<string>()): Set<string> {
  if (!schema || typeof schema !== 'object') return references
  if (Array.isArray(schema)) {
    for (const value of schema) schemaReferences(value, references)
    return references
  }
  const object = schema as JsonObject
  if (typeof object.$ref === 'string' && object.$ref.startsWith('#/components/schemas/')) {
    references.add(object.$ref.split('/').at(-1)!)
  }
  for (const value of Object.values(object)) schemaReferences(value, references)
  return references
}

function orderSchemas(schemas: JsonObject): string[] {
  const ordered: string[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()

  function visit(name: string): void {
    if (visited.has(name)) return
    if (visiting.has(name))
      throw new Error(`Recursive component schemas are not supported: ${name}`)
    visiting.add(name)
    for (const dependency of schemaReferences(schemas[name])) {
      if (dependency in schemas) visit(dependency)
    }
    visiting.delete(name)
    visited.add(name)
    ordered.push(name)
  }

  for (const name of Object.keys(schemas)) visit(name)
  return ordered
}

function literal(value: unknown): string {
  if (value === undefined) return 'undefined'
  return JSON.stringify(value)
}

function zodSchema(schemaValue: unknown): string {
  if (!schemaValue || typeof schemaValue !== 'object') return 'z.unknown()'
  const schema = schemaValue as JsonObject

  if (typeof schema.$ref === 'string') {
    return `${identifier(schema.$ref.split('/').at(-1)!)}Schema`
  }
  if (schema.const !== undefined) return `z.literal(${literal(schema.const)})`
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return `z.enum([${schema.enum.map(literal).join(', ')}])`
  }
  if (Array.isArray(schema.oneOf)) {
    return unionSchema(schema.oneOf.map(zodSchema))
  }
  if (Array.isArray(schema.anyOf)) {
    return unionSchema(schema.anyOf.map(zodSchema))
  }
  if (Array.isArray(schema.allOf)) {
    return schema.allOf.map(zodSchema).reduce((left, right) => `${left}.and(${right})`)
  }

  const declaredTypes = Array.isArray(schema.type) ? schema.type : [schema.type]
  const nullable = declaredTypes.includes('null') || schema.nullable === true
  const type = declaredTypes.find((candidate) => candidate !== 'null')
  let expression: string

  switch (type) {
    case 'object': {
      const properties = (schema.properties as JsonObject | undefined) ?? {}
      const required = new Set(Array.isArray(schema.required) ? (schema.required as string[]) : [])
      const fields = Object.entries(properties).map(([name, property]) => {
        const propertySchema = zodSchema(property)
        return `${JSON.stringify(name)}: ${required.has(name) ? propertySchema : `${propertySchema}.optional()`}`
      })
      expression = `z.object({${fields.length ? `\n${fields.map((field) => `  ${field}`).join(',\n')}\n` : ''}})`
      if (schema.additionalProperties === true || schema.additionalProperties === undefined) {
        expression += '.passthrough()'
      } else if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
        expression += `.catchall(${zodSchema(schema.additionalProperties)})`
      } else expression += '.strict()'
      break
    }
    case 'array': {
      expression = `z.array(${zodSchema(schema.items)})`
      if (typeof schema.minItems === 'number') expression += `.min(${schema.minItems})`
      if (typeof schema.maxItems === 'number') expression += `.max(${schema.maxItems})`
      break
    }
    case 'integer':
      expression = 'z.number().int()'
      if (typeof schema.minimum === 'number') expression += `.min(${schema.minimum})`
      if (typeof schema.maximum === 'number') expression += `.max(${schema.maximum})`
      break
    case 'number':
      expression = 'z.number()'
      if (typeof schema.minimum === 'number') expression += `.min(${schema.minimum})`
      if (typeof schema.maximum === 'number') expression += `.max(${schema.maximum})`
      break
    case 'boolean':
      expression = 'z.boolean()'
      break
    case 'null':
      expression = 'z.null()'
      break
    case 'string':
    default:
      if (type === undefined) expression = 'z.unknown()'
      else if (type !== 'string') expression = 'z.unknown()'
      else if (schema.format === 'date-time') expression = 'z.date()'
      else {
        expression = 'z.string()'
        if (typeof schema.minLength === 'number') expression += `.min(${schema.minLength})`
        if (typeof schema.maxLength === 'number') expression += `.max(${schema.maxLength})`
        if (typeof schema.pattern === 'string')
          expression += `.regex(new RegExp(${literal(schema.pattern)}))`
        if (schema.format === 'email') expression += '.email()'
        if (schema.format === 'uuid') expression += '.uuid()'
      }
  }

  if (nullable) expression += '.nullable()'
  if (schema.default !== undefined) expression += `.default(${literal(schema.default)})`
  return expression
}

function unionSchema(items: string[]): string {
  if (items.length === 0) return 'z.never()'
  if (items.length === 1) return items[0]
  return `z.union([${items.join(', ')}])`
}

function jsonSchemaFromContent(container: JsonObject | undefined): JsonObject | undefined {
  if (!container) return undefined
  const content = container.content as JsonObject | undefined
  if (!content) return undefined
  const media = (content['application/json'] ?? Object.values(content)[0]) as JsonObject | undefined
  return media?.schema as JsonObject | undefined
}

function operationInputSchema(
  document: JsonObject,
  pathItem: JsonObject,
  operation: JsonObject
): { schema: JsonObject; required: boolean } {
  const parameters = [
    ...((pathItem.parameters as unknown[] | undefined) ?? []),
    ...((operation.parameters as unknown[] | undefined) ?? [])
  ].map((parameter) => dereference(document, parameter))

  const properties: JsonObject = {}
  const requiredGroups: string[] = []
  for (const location of ['path', 'query'] as const) {
    const values = parameters.filter((parameter) => parameter.in === location)
    if (values.length === 0) continue
    const groupProperties: JsonObject = {}
    const groupRequired: string[] = []
    for (const parameter of values) {
      const name = String(parameter.name)
      groupProperties[name] = (parameter.schema as JsonObject | undefined) ?? {}
      if (parameter.required === true) groupRequired.push(name)
    }
    properties[location] = {
      type: 'object',
      properties: groupProperties,
      required: groupRequired,
      additionalProperties: false
    }
    if (groupRequired.length > 0) requiredGroups.push(location)
  }

  if (operation.requestBody) {
    const requestBody = dereference(document, operation.requestBody)
    properties.body = jsonSchemaFromContent(requestBody) ?? {}
    if (requestBody.required === true) requiredGroups.push('body')
  }

  return {
    schema: {
      type: 'object',
      properties,
      required: requiredGroups,
      additionalProperties: false
    },
    required: requiredGroups.length > 0
  }
}

function collectOperations(document: JsonObject): Operation[] {
  const paths = asObject(document.paths, 'paths')
  const seen = new Set<string>()
  const operations: Operation[] = []

  for (const [path, rawPathItem] of Object.entries(paths)) {
    const pathItem = asObject(rawPathItem, `path ${path}`)
    for (const method of HTTP_METHODS) {
      if (!pathItem[method]) continue
      const operation = asObject(pathItem[method], `${method.toUpperCase()} ${path}`)
      if (typeof operation.operationId !== 'string' || !operation.operationId) {
        throw new Error(`${method.toUpperCase()} ${path} is missing operationId`)
      }
      if (seen.has(operation.operationId))
        throw new Error(`Duplicate operationId: ${operation.operationId}`)
      seen.add(operation.operationId)

      const responses = asObject(operation.responses, `${operation.operationId} responses`)
      const responseEntries = Object.entries(responses).map(([status, rawResponse]) => ({
        status,
        response: dereference(document, rawResponse)
      }))
      const success = responseEntries.find(({ status }) => /^2\d\d$/.test(status))
      if (!success) throw new Error(`${operation.operationId} has no 2xx response`)
      const errors = responseEntries
        .filter(({ status }) => !/^2\d\d$/.test(status))
        .map(({ status, response }) => ({
          status: status === 'default' ? ('default' as const) : Number(status),
          schema: jsonSchemaFromContent(response)
        }))
      const input = operationInputSchema(document, pathItem, operation)
      const tag =
        Array.isArray(operation.tags) && operation.tags.length
          ? String(operation.tags[0])
          : 'default'

      operations.push({
        id: operation.operationId,
        typeName: `Operation${pascalCase(operation.operationId)}`,
        tag: identifier(tag),
        method: method.toUpperCase(),
        path,
        inputSchema: input.schema,
        outputSchema: jsonSchemaFromContent(success.response),
        errors,
        inputRequired: input.required
      })
    }
  }
  return operations
}

function contractSource(document: JsonObject, operations: Operation[]): string {
  const components = (document.components as JsonObject | undefined) ?? {}
  const schemas = (components.schemas as JsonObject | undefined) ?? {}
  const componentBlocks = orderSchemas(schemas).map((name) => {
    const safeName = identifier(name)
    return `export const ${safeName}Schema = ${zodSchema(schemas[name])}\nexport type ${safeName} = z.infer<typeof ${safeName}Schema>`
  })

  const operationBlocks = operations.map((operation) => {
    const errorVariants = operation.errors.map(({ status, schema }) => {
      const statusSchema = status === 'default' ? `z.literal('default')` : `z.literal(${status})`
      return `z.object({ status: ${statusSchema}, body: ${schema ? zodSchema(schema) : 'z.undefined()'} })`
    })
    return `export const ${operation.typeName}InputSchema = ${zodSchema(operation.inputSchema)}
export type ${operation.typeName}Input = z.infer<typeof ${operation.typeName}InputSchema>
export const ${operation.typeName}OutputSchema = ${operation.outputSchema ? zodSchema(operation.outputSchema) : 'z.undefined()'}
export type ${operation.typeName}Output = z.infer<typeof ${operation.typeName}OutputSchema>
export const ${operation.typeName}ErrorSchema = ${unionSchema(errorVariants)}
export type ${operation.typeName}Error = z.infer<typeof ${operation.typeName}ErrorSchema>`
  })

  const operationInterface = operations
    .map(
      (operation) => `  ${JSON.stringify(operation.id)}: {
    input: ${operation.typeName}Input
    output: ${operation.typeName}Output
    error: ${operation.typeName}Error
  }`
    )
    .join('\n')

  const contracts = operations
    .map(
      (operation) => `  ${JSON.stringify(operation.id)}: {
    method: ${JSON.stringify(operation.method)},
    path: ${JSON.stringify(operation.path)},
    tag: ${JSON.stringify(operation.tag)},
    input: ${operation.typeName}InputSchema,
    output: ${operation.typeName}OutputSchema,
    error: ${operation.typeName}ErrorSchema
  }`
    )
    .join(',\n')

  return `${GENERATED_HEADER}
import { z } from 'zod'

${componentBlocks.join('\n\n')}

${operationBlocks.join('\n\n')}

export interface ApiOperations {
${operationInterface}
}

export type ApiOperationId = keyof ApiOperations
export type ApiInput<K extends ApiOperationId> = ApiOperations[K]['input']
export type ApiOutput<K extends ApiOperationId> = ApiOperations[K]['output']
export type ApiDeclaredError<K extends ApiOperationId> = ApiOperations[K]['error']

export const operationContracts = {
${contracts}
} as const
`
}

function clientSource(operations: Operation[]): string {
  const byTag = new Map<string, Operation[]>()
  for (const operation of operations) {
    const current = byTag.get(operation.tag) ?? []
    current.push(operation)
    byTag.set(operation.tag, current)
  }

  const interfaceTags = [...byTag.entries()]
    .map(
      ([tag, values]) => `  ${JSON.stringify(tag)}: {
${values
  .map(
    (operation) =>
      `    ${JSON.stringify(operation.id)}(${operation.inputRequired ? `input: ${operation.typeName}Input` : `input?: ${operation.typeName}Input`}): Promise<${operation.typeName}Output>`
  )
  .join('\n')}
  }`
    )
    .join('\n')

  const implementationTags = [...byTag.entries()]
    .map(
      ([tag, values]) => `    ${JSON.stringify(tag)}: {
${values
  .map(
    (operation) =>
      `      ${JSON.stringify(operation.id)}: (${operation.inputRequired ? 'input' : `input = {}`}) => invoke(${JSON.stringify(operation.id)}, input as ${operation.typeName}Input)`
  )
  .join(',\n')}
    }`
    )
    .join(',\n')

  const typeImports = operations.flatMap((operation) => [
    `${operation.typeName}Input`,
    `${operation.typeName}Output`
  ])

  return `${GENERATED_HEADER}
import type {
  ApiInput,
  ApiOperationId,
  ApiOutput,
  ${typeImports.join(',\n  ')}
} from './contract.generated'
import { ApiClientError, type ApiTransport } from '../ipc'

export interface ApiClient {
${interfaceTags}
}

export function createApiClient(transport: ApiTransport): ApiClient {
  const invoke = async <K extends ApiOperationId>(operationId: K, input: ApiInput<K>): Promise<ApiOutput<K>> => {
    const result = await transport(operationId, input)
    if (!result.ok) throw new ApiClientError(result.error)
    return result.data
  }

  return {
${implementationTags}
  }
}
`
}

function indexSource(): string {
  return `${GENERATED_HEADER}
export * from './contract.generated'
export * from './client.generated'
`
}

export async function buildGeneratedFiles(rootDirectory = process.cwd()): Promise<GeneratedFile[]> {
  const inputPath = resolve(rootDirectory, ipcGeneratorConfig.input)
  const document = asObject(parse(await readFile(inputPath, 'utf8')), 'OpenAPI document')
  const operations = collectOperations(document)
  const outputDirectory = resolve(rootDirectory, ipcGeneratorConfig.outputDirectory)
  const sources = [
    {
      path: resolve(outputDirectory, 'contract.generated.ts'),
      source: contractSource(document, operations)
    },
    { path: resolve(outputDirectory, 'client.generated.ts'), source: clientSource(operations) },
    { path: resolve(outputDirectory, 'index.ts'), source: indexSource() }
  ]

  return Promise.all(
    sources.map(async ({ path, source }) => ({
      path,
      content: await format(source, {
        parser: 'typescript',
        singleQuote: true,
        semi: false,
        printWidth: 100,
        trailingComma: 'none'
      })
    }))
  )
}
