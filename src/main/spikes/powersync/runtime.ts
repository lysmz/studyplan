import { join } from 'node:path'
import type { PowerSyncDatabase } from '@powersync/node'
import { readPowerSyncSpikeRemoteConfig, SupabasePowerSyncSpikeConnector } from './connector'
import { openPowerSyncSpikeDatabase } from './database'
import { PowerSyncSpikeTaskRepository } from './task.repository'

export interface PowerSyncSpikeRuntime {
  database: PowerSyncDatabase
  repository: PowerSyncSpikeTaskRepository
  mode: 'local-only' | 'connected'
  ownerId: string
  close(): Promise<void>
}

function sanitizeDeviceId(value: string | undefined): string {
  const normalized = value?.trim() || 'device-a'
  return normalized.replace(/[^a-zA-Z0-9_-]/g, '-')
}

export async function startPowerSyncSpike(
  userDataDirectory: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<PowerSyncSpikeRuntime> {
  const deviceId = sanitizeDeviceId(environment.POWERSYNC_SPIKE_DEVICE_ID)
  const directory = join(userDataDirectory, 'powersync-spike')
  const database = await openPowerSyncSpikeDatabase({
    directory,
    filename: `powersync-spike-${deviceId}.db`,
    verbose: environment.POWERSYNC_SPIKE_VERBOSE === 'true'
  })
  const repository = new PowerSyncSpikeTaskRepository(database)
  const remoteConfig = readPowerSyncSpikeRemoteConfig(environment)

  let connector: SupabasePowerSyncSpikeConnector | null = null
  let ownerId = `local-${deviceId}`
  if (remoteConfig) {
    connector = await SupabasePowerSyncSpikeConnector.signIn(remoteConfig)
    ownerId = await connector.getUserId()
    await database.connect(connector)
  }

  const existing = await repository.listForOwner(ownerId)
  if (existing.length === 0) {
    await repository.create({
      ownerId,
      title: `PowerSync persistence probe (${deviceId})`,
      priority: 'medium'
    })
  }

  const queue = await database.getUploadQueueStats()
  console.info(
    `[PowerSync spike] ${connector ? 'connected' : 'local-only'}; device=${deviceId}; ` +
      `owner=${ownerId}; queued=${queue.count}`
  )

  return {
    database,
    repository,
    mode: connector ? 'connected' : 'local-only',
    ownerId,
    async close() {
      await database.close()
      await connector?.signOut()
    }
  }
}
