import type { PowerSyncSQLiteDatabase } from '@powersync/drizzle-driver'
import { wrapPowerSyncWithDrizzle } from '@powersync/drizzle-driver'
import type { PowerSyncDatabase } from '@powersync/node'
import { openPowerSyncSpikeDatabase } from '../spikes/powersync'
import { powerSyncCollaborationSchema, powerSyncCollaborationSchemaDefinition } from './schema'

export interface CollaborationDatabase {
  powerSync: PowerSyncDatabase
  drizzle: PowerSyncSQLiteDatabase<typeof powerSyncCollaborationSchemaDefinition>
}

export async function openCollaborationDatabase(
  directory: string,
  filename: string
): Promise<CollaborationDatabase> {
  const powerSync = await openPowerSyncSpikeDatabase({
    directory,
    filename,
    schema: powerSyncCollaborationSchema
  })
  const drizzle = wrapPowerSyncWithDrizzle(powerSync, {
    schema: powerSyncCollaborationSchemaDefinition
  })
  return { powerSync, drizzle }
}
