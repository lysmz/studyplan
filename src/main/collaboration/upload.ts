import type { PowerSyncDatabase } from '@powersync/node'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import type { CollaborationUploadFailure } from '../../shared/collaboration/ipc'

export interface UploadFailureStore {
  find(operationId: string): Promise<CollaborationUploadFailure | null>
  hasTask(taskId: string): Promise<boolean>
  save(record: CollaborationUploadFailure): Promise<void>
  list(): Promise<CollaborationUploadFailure[]>
}

const resultSchema = z.discriminatedUnion('outcome', [
  z.object({ outcome: z.enum(['accepted', 'already_applied']) }),
  z.object({
    outcome: z.literal('rejected'),
    code: z.enum(['MISSING_OR_INACCESSIBLE', 'INVALID_TASK', 'TASK_CONFLICT', 'OPERATION_CONFLICT'])
  })
])

/** Complete only the oldest transaction. Remote receipts cover partial success and lost replies. */
export async function uploadTaskTransaction(
  database: PowerSyncDatabase,
  supabase: SupabaseClient,
  userId: string,
  failures: UploadFailureStore
): Promise<void> {
  const transaction = await database.getNextCrudTransaction()
  if (!transaction) return
  const replicaId = await database.getClientId()
  for (const entry of transaction.crud) {
    if (entry.table !== 'group_tasks')
      throw new Error('A server-managed table entered the task upload queue.')
    const operationId = `${userId}:${replicaId}:${entry.clientId}`
    if (await failures.find(operationId)) continue // Crash after journal commit, before acknowledgement.
    let reason: CollaborationUploadFailure['reason'] | null = null
    if (await failures.hasTask(entry.id)) reason = 'DEPENDENCY_REJECTED'
    else {
      const { data, error } = await supabase.rpc('upload_group_task', {
        p_replica_id: replicaId,
        p_operation_id: String(entry.clientId),
        p_task_id: entry.id,
        p_operation: entry.op,
        p_data: entry.opData ?? {}
      })
      // Only structured, known RPC rejections are terminal. Transport, auth, configuration and
      // unknown errors remain queued; do not persist raw backend messages or request credentials.
      if (error) throw new Error(`Task upload remains pending (${error.code || 'transport'}).`)
      const result = resultSchema.safeParse(data)
      if (!result.success)
        throw new Error('Unrecognized task upload response; the write remains pending.')
      if (result.data.outcome === 'rejected') reason = result.data.code
    }
    if (reason) {
      const snapshot =
        (await database.getOptional<Record<string, unknown>>(
          'SELECT * FROM group_tasks WHERE id = ?',
          [entry.id]
        )) ??
        entry.previousValues ??
        null
      const changes = entry.opData ?? {}
      const groupId =
        typeof changes.group_id === 'string'
          ? changes.group_id
          : typeof snapshot?.group_id === 'string'
            ? snapshot.group_id
            : null
      await failures.save({
        operationId,
        userId,
        taskId: entry.id,
        groupId,
        operation: entry.op,
        changes,
        snapshot,
        reason,
        detectedAt: new Date().toISOString()
      })
    }
  }
  await transaction.complete()
}
