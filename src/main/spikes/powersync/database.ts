import { mkdir } from 'node:fs/promises'
import type { Schema } from '@powersync/node'
import { PowerSyncDatabase, createConsoleLogger, LogLevels } from '@powersync/node'
import { powerSyncSpikeSchemaV2 } from './schema'
import createPowerSyncWorker from './powersync.worker?nodeWorker'

export interface OpenPowerSyncSpikeDatabaseOptions {
  directory: string
  filename: string
  schema?: Schema
  verbose?: boolean
}

export async function openPowerSyncSpikeDatabase({
  directory,
  filename,
  schema = powerSyncSpikeSchemaV2,
  verbose = false
}: OpenPowerSyncSpikeDatabaseOptions): Promise<PowerSyncDatabase> {
  await mkdir(directory, { recursive: true })

  const database = new PowerSyncDatabase({
    schema,
    database: {
      dbFilename: filename,
      dbLocation: directory,
      readWorkerCount: 1,
      implementation: { type: 'better-sqlite3' },
      openWorker: (_defaultWorkerUrl, options) => createPowerSyncWorker(options ?? {})
    },
    logger: createConsoleLogger({ minLevel: verbose ? LogLevels.debug : LogLevels.warn })
  })

  await database.init()
  return database
}
