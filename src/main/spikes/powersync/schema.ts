import { column, Schema, Table } from '@powersync/node'

const spikeTaskColumnsV1 = {
  owner_id: column.text,
  title: column.text,
  status: column.text,
  created_at: column.text,
  updated_at: column.text
}

const spikeTaskColumnsV2 = {
  ...spikeTaskColumnsV1,
  priority: column.text
}

export const powerSyncSpikeSchemaV1 = new Schema({
  spike_tasks: new Table(spikeTaskColumnsV1, {
    indexes: { owner: ['owner_id'], status: ['status'] }
  })
})

export const powerSyncSpikeSchemaV2 = new Schema({
  spike_tasks: new Table(spikeTaskColumnsV2, {
    indexes: { owner: ['owner_id'], status: ['status'] }
  })
})

export type SpikeTaskStatus = 'open' | 'done'
export type SpikeTaskPriority = 'low' | 'medium' | 'high'

export interface SpikeTask {
  id: string
  ownerId: string
  title: string
  status: SpikeTaskStatus
  priority: SpikeTaskPriority | null
  createdAt: string
  updatedAt: string
}
