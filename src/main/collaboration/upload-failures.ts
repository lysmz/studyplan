import type { PowerSyncDatabase } from '@powersync/node'
import { z } from 'zod'
import type { CollaborationUploadFailure } from '../../shared/collaboration/ipc'
import type { UploadFailureStore } from './upload'

const failureSchema = z.object({
  operationId: z.string(),
  userId: z.string(),
  taskId: z.string(),
  groupId: z.string().nullable(),
  operation: z.enum(['PUT', 'PATCH', 'DELETE']),
  changes: z.record(z.string(), z.unknown()),
  snapshot: z.record(z.string(), z.unknown()).nullable(),
  reason: z.enum([
    'MISSING_OR_INACCESSIBLE',
    'INVALID_TASK',
    'TASK_CONFLICT',
    'OPERATION_CONFLICT',
    'DEPENDENCY_REJECTED'
  ]),
  detectedAt: z.string()
})

export class LocalUploadFailureStore implements UploadFailureStore {
  constructor(
    private readonly database: PowerSyncDatabase,
    private readonly userId: string
  ) {}
  async find(operationId: string): Promise<CollaborationUploadFailure | null> {
    const row = await this.database.getOptional<{ record: string }>(
      'SELECT record FROM collaboration_upload_failures WHERE id = ? AND user_id = ?',
      [operationId, this.userId]
    )
    return row ? failureSchema.parse(JSON.parse(row.record)) : null
  }
  async hasTask(taskId: string): Promise<boolean> {
    return Boolean(
      await this.database.getOptional(
        'SELECT id FROM collaboration_upload_failures WHERE task_id = ? AND user_id = ? LIMIT 1',
        [taskId, this.userId]
      )
    )
  }
  async save(record: CollaborationUploadFailure): Promise<void> {
    if (record.userId !== this.userId)
      throw new Error("Cannot save another account's upload failure.")
    failureSchema.parse(record)
    await this.database.execute(
      'INSERT OR IGNORE INTO collaboration_upload_failures (id, user_id, task_id, detected_at, record) VALUES (?, ?, ?, ?, ?)',
      [record.operationId, this.userId, record.taskId, record.detectedAt, JSON.stringify(record)]
    )
  }
  async list(): Promise<CollaborationUploadFailure[]> {
    const rows = await this.database.getAll<{ record: string }>(
      'SELECT record FROM collaboration_upload_failures WHERE user_id = ? ORDER BY detected_at DESC, id',
      [this.userId]
    )
    return rows.map((row) => failureSchema.parse(JSON.parse(row.record)))
  }
}
