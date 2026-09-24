import type { PowerSyncDatabase } from '@powersync/node'
import type { SpikeTask, SpikeTaskPriority, SpikeTaskStatus } from './schema'

interface SpikeTaskRow {
  id: string
  owner_id: string
  title: string
  status: SpikeTaskStatus
  priority?: SpikeTaskPriority | null
  created_at: string
  updated_at: string
}

export interface CreateSpikeTaskInput {
  id?: string
  ownerId: string
  title: string
  status?: SpikeTaskStatus
  priority?: SpikeTaskPriority | null
}

function toSpikeTask(row: SpikeTaskRow): SpikeTask {
  return {
    id: row.id,
    ownerId: row.owner_id,
    title: row.title,
    status: row.status,
    priority: row.priority ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

export class PowerSyncSpikeTaskRepository {
  constructor(private readonly database: PowerSyncDatabase) {}

  async create(input: CreateSpikeTaskInput): Promise<SpikeTask> {
    const id = input.id ?? crypto.randomUUID()
    const timestamp = new Date().toISOString()
    const result = await this.database.execute(
      `INSERT INTO spike_tasks (
        id, owner_id, title, status, priority, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id, owner_id, title, status, priority, created_at, updated_at`,
      [
        id,
        input.ownerId,
        input.title,
        input.status ?? 'open',
        input.priority ?? null,
        timestamp,
        timestamp
      ]
    )

    const row = result.rows?.item(0) as SpikeTaskRow | undefined
    if (!row) throw new Error('PowerSync did not return the created spike task.')
    return toSpikeTask(row)
  }

  async listForOwner(ownerId: string): Promise<SpikeTask[]> {
    const rows = await this.database.getAll<SpikeTaskRow>(
      `SELECT id, owner_id, title, status, priority, created_at, updated_at
       FROM spike_tasks
       WHERE owner_id = ?
       ORDER BY created_at, id`,
      [ownerId]
    )
    return rows.map(toSpikeTask)
  }

  async updatePriority(id: string, priority: SpikeTaskPriority | null): Promise<SpikeTask> {
    const result = await this.database.execute(
      `UPDATE spike_tasks
       SET priority = ?, updated_at = ?
       WHERE id = ?
       RETURNING id, owner_id, title, status, priority, created_at, updated_at`,
      [priority, new Date().toISOString(), id]
    )
    const row = result.rows?.item(0) as SpikeTaskRow | undefined
    if (!row) throw new Error(`Spike task ${id} was not found.`)
    return toSpikeTask(row)
  }

  async setStatus(id: string, status: SpikeTaskStatus): Promise<SpikeTask> {
    const result = await this.database.execute(
      `UPDATE spike_tasks
       SET status = ?, updated_at = ?
       WHERE id = ?
       RETURNING id, owner_id, title, status, priority, created_at, updated_at`,
      [status, new Date().toISOString(), id]
    )
    const row = result.rows?.item(0) as SpikeTaskRow | undefined
    if (!row) throw new Error(`Spike task ${id} was not found.`)
    return toSpikeTask(row)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.database.execute(
      'DELETE FROM spike_tasks WHERE id = ? RETURNING id',
      [id]
    )
    return (result.rows?.length ?? 0) > 0
  }
}
