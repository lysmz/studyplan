import type { PowerSyncSQLiteDatabase } from '@powersync/drizzle-driver'
import { wrapPowerSyncWithDrizzle } from '@powersync/drizzle-driver'
import type { PowerSyncDatabase } from '@powersync/node'
import { openPowerSyncSpikeDatabase } from '../powersync'
import { powerSyncDrizzleSchema, powerSyncDrizzleSchemaDefinition } from './schema'

export interface PowerSyncDrizzleDatabase {
  powerSync: PowerSyncDatabase
  drizzle: PowerSyncSQLiteDatabase<typeof powerSyncDrizzleSchemaDefinition>
}

export async function openPowerSyncDrizzleDatabase(
  directory: string,
  filename: string
): Promise<PowerSyncDrizzleDatabase> {
  const powerSync = await openPowerSyncSpikeDatabase({
    directory,
    filename,
    schema: powerSyncDrizzleSchema
  })
  const drizzle = wrapPowerSyncWithDrizzle(powerSync, {
    schema: powerSyncDrizzleSchemaDefinition
  })
  return { powerSync, drizzle }
}
