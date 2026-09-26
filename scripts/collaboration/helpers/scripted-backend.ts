import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PowerSyncDatabase } from '@powersync/node'
import type { CollaborationUploadFailure } from '../../../src/shared/collaboration/ipc'

export const aliceId = '11111111-1111-4111-8111-111111111111'
export const groupId = '33333333-3333-4333-8333-333333333333'
export const replicaId = '77777777-7777-4777-8777-777777777777'
export type Entry = {
  clientId: number
  id: string
  table: string
  op: 'PUT' | 'PATCH' | 'DELETE'
  opData?: Record<string, unknown>
  transactionId?: number
}
export function put(id: string, clientId = 1): Entry {
  return {
    clientId,
    id,
    table: 'group_tasks',
    op: 'PUT',
    opData: {
      group_id: groupId,
      title: 'Alice original',
      status: 'open',
      created_by: aliceId,
      created_at: '2026-09-26T10:00:00Z'
    }
  }
}

export class MemoryFailures {
  records = new Map<string, CollaborationUploadFailure>()
  failSave = false
  async find(operationId: string): Promise<CollaborationUploadFailure | null> {
    return this.records.get(operationId) ?? null
  }
  async hasTask(taskId: string): Promise<boolean> {
    return [...this.records.values()].some((row) => row.taskId === taskId)
  }
  async save(record: CollaborationUploadFailure): Promise<void> {
    if (this.failSave) throw new Error('Journal unavailable')
    if (!this.records.has(record.operationId)) this.records.set(record.operationId, record)
  }
  async list(): Promise<CollaborationUploadFailure[]> {
    return [...this.records.values()]
  }
}

export class MemoryQueue {
  entries: Entry[]
  failAck = false
  onComplete?: () => void
  constructor(
    entries: Entry[],
    readonly replica = replicaId
  ) {
    this.entries = [...entries]
  }
  async getClientId(): Promise<string> {
    return this.replica
  }
  async getCrudBatch(limit = 100): Promise<ReturnType<MemoryQueue['batch']> | null> {
    return this.entries.length ? this.batch(this.entries.slice(0, limit)) : null
  }
  async getNextCrudTransaction(): Promise<ReturnType<MemoryQueue['batch']> | null> {
    const first = this.entries[0]
    if (!first) return null
    const entries =
      first.transactionId === undefined
        ? [first]
        : this.entries.filter((e) => e.transactionId === first.transactionId)
    return this.batch(entries)
  }
  batch(crud: Entry[]): { crud: Entry[]; complete: () => Promise<void> } {
    return {
      crud,
      complete: async () => {
        this.onComplete?.()
        if (this.failAck) throw new Error('Acknowledgement unavailable')
        this.entries = this.entries.filter((e) => !crud.includes(e))
      }
    }
  }
  async getOptional(): Promise<null> {
    return null
  }
  database(): PowerSyncDatabase {
    return this as unknown as PowerSyncDatabase
  }
}

/** A server state model reached through the real Supabase HTTP client. No network is used. */
export class ScriptedBackend {
  rows = new Map<string, Record<string, unknown>>()
  denied = new Set<string>()
  failOnce: string | null = null
  loseResponseOnce: string | null = null
  responseOverride: { status: number; body: unknown } | null = null
  requests = 0
  receipts = new Map<string, { payload: string; outcome: Record<string, unknown> }>()
  mutations = 0
  client(): SupabaseClient {
    return createClient('https://synthetic.supabase.test', 'synthetic-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: this.fetch }
    })
  }
  fetch: typeof fetch = async (input, init) => {
    this.requests++
    const url = new URL(
      typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    )
    const body = init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : {}
    const rpc = url.pathname.endsWith('/rpc/upload_group_task')
    const id = String(
      rpc ? body.p_task_id : (body.id ?? url.searchParams.get('id')?.replace(/^eq\./, ''))
    )
    if (this.responseOverride)
      return this.response(this.responseOverride.status, this.responseOverride.body)
    if (this.failOnce === id) {
      this.failOnce = null
      return this.response(503, { code: '503', message: 'Temporary outage' })
    }
    if (this.denied.has(id) && !rpc) return this.response(403, { code: '42501', message: 'Denied' })
    let result: unknown = null
    if (rpc) {
      const key = `${body.p_replica_id}:${body.p_operation_id}`
      const payload = JSON.stringify([body.p_task_id, body.p_operation, body.p_data])
      const receipt = this.receipts.get(key)
      if (receipt)
        result =
          receipt.payload === payload
            ? receipt.outcome.outcome === 'accepted'
              ? { outcome: 'already_applied' }
              : receipt.outcome
            : { outcome: 'rejected', code: 'OPERATION_CONFLICT' }
      else {
        const op = String(body.p_operation)
        const data = body.p_data as Record<string, unknown>
        if (this.denied.has(id)) result = { outcome: 'rejected', code: 'MISSING_OR_INACCESSIBLE' }
        else if (op === 'PUT' && this.rows.has(id))
          result = { outcome: 'rejected', code: 'TASK_CONFLICT' }
        else if (op === 'PATCH' && !this.rows.has(id))
          result = { outcome: 'rejected', code: 'MISSING_OR_INACCESSIBLE' }
        else {
          if (op === 'PUT') this.rows.set(id, { id, ...data })
          if (op === 'PATCH') this.rows.set(id, { ...this.rows.get(id), ...data })
          if (op === 'DELETE') this.rows.delete(id)
          this.mutations++
          result = { outcome: 'accepted' }
        }
        this.receipts.set(key, { payload, outcome: result as Record<string, unknown> })
      }
    } else {
      if (init?.method === 'POST') {
        this.rows.set(id, { id, ...body })
        this.mutations++
      }
      if (init?.method === 'PATCH' && this.rows.has(id)) {
        this.rows.set(id, { ...this.rows.get(id), ...body })
        this.mutations++
      }
      if (init?.method === 'DELETE') {
        this.rows.delete(id)
        this.mutations++
      }
      result =
        init?.headers && new Headers(init.headers).get('Prefer')?.includes('return=representation')
          ? this.rows.has(id)
            ? [this.rows.get(id)]
            : []
          : null
    }
    if (this.loseResponseOnce === id) {
      this.loseResponseOnce = null
      throw new TypeError('Simulated lost response')
    }
    return this.response(result === null ? 204 : 200, result)
  }
  response(status: number, body: unknown): Response {
    return new Response(status === 204 ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
