import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { PowerSyncDatabase } from '@powersync/node'
import {
  SupabasePowerSyncSpikeConnector,
  type PowerSyncSpikeRemoteConfig
} from '../powersync/connector'
import { openPowerSyncDrizzleDatabase, type PowerSyncDrizzleDatabase } from './database'
import { PowerSyncDrizzleEventsRepository } from './event.repository'

interface CloudSpikeCheck {
  name: string
  status: 'pass'
  evidence: Record<string, unknown>
}

interface CloudSpikeConfig {
  alice: PowerSyncSpikeRemoteConfig
  bob: PowerSyncSpikeRemoteConfig
}

function requireValue(value: string | undefined, name: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${name} is required for the Drizzle cloud spike.`)
  return normalized
}

function readCloudSpikeConfig(environment: NodeJS.ProcessEnv): CloudSpikeConfig {
  const common = {
    powerSyncEndpoint: requireValue(
      environment.POWERSYNC_SPIKE_ENDPOINT,
      'POWERSYNC_SPIKE_ENDPOINT'
    ),
    supabaseUrl: requireValue(environment.SUPABASE_URL, 'SUPABASE_URL'),
    supabaseAnonKey: requireValue(
      environment.SUPABASE_PUBLISHABLE_KEY ?? environment.SUPABASE_ANON_KEY,
      'SUPABASE_PUBLISHABLE_KEY (or legacy SUPABASE_ANON_KEY)'
    )
  }
  return {
    alice: {
      ...common,
      email: environment.POWERSYNC_SPIKE_ALICE_EMAIL?.trim() || 'alice@example.com',
      password: requireValue(
        environment.POWERSYNC_SPIKE_ALICE_PASSWORD,
        'POWERSYNC_SPIKE_ALICE_PASSWORD'
      )
    },
    bob: {
      ...common,
      email: environment.POWERSYNC_SPIKE_BOB_EMAIL?.trim() || 'bob@example.com',
      password: requireValue(
        environment.POWERSYNC_SPIKE_BOB_PASSWORD,
        'POWERSYNC_SPIKE_BOB_PASSWORD'
      )
    }
  }
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function waitUntil(
  description: string,
  predicate: () => Promise<boolean>,
  timeoutMilliseconds = 45_000
): Promise<void> {
  const deadline = Date.now() + timeoutMilliseconds
  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${description}.`)
}

async function waitForUploadQueue(database: PowerSyncDatabase): Promise<void> {
  await waitUntil('the PowerSync upload queue to drain', async () => {
    return (await database.getUploadQueueStats()).count === 0
  })
}

function describeSyncStatus(database: PowerSyncDatabase): Record<string, unknown> {
  const status = database.currentStatus
  return {
    message: status.getMessage(),
    connected: status.connected,
    connecting: status.connecting,
    downloading: status.downloading,
    hasSynced: status.hasSynced,
    downloadError: status.downloadError?.message,
    streams: status.syncStreams?.map(({ subscription }) => ({
      name: subscription.name,
      active: subscription.active,
      isDefault: subscription.isDefault,
      hasSynced: subscription.hasSynced
    }))
  }
}

async function signInSupabase(config: PowerSyncSpikeRemoteConfig): Promise<SupabaseClient> {
  const client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false }
  })
  const { error } = await client.auth.signInWithPassword({
    email: config.email,
    password: config.password
  })
  if (error) throw new Error(`Direct Supabase sign-in failed: ${error.message}`)
  return client
}

export async function runElectronPowerSyncDrizzleCloudChecks(
  temporaryRoot: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<CloudSpikeCheck[]> {
  const config = readCloudSpikeConfig(environment)
  const directory = await mkdtemp(join(temporaryRoot, 'studyplan-powersync-drizzle-cloud-'))
  const checks: CloudSpikeCheck[] = []
  const databases: PowerSyncDrizzleDatabase[] = []
  const connectors: SupabasePowerSyncSpikeConnector[] = []
  let aliceClient: SupabaseClient | undefined
  let bobClient: SupabaseClient | undefined
  let createdEventId: string | undefined

  try {
    const [aliceA, aliceB, bob] = await Promise.all([
      SupabasePowerSyncSpikeConnector.signIn(config.alice),
      SupabasePowerSyncSpikeConnector.signIn(config.alice),
      SupabasePowerSyncSpikeConnector.signIn(config.bob)
    ])
    connectors.push(aliceA, aliceB, bob)
    const aliceId = await aliceA.getUserId()
    const bobId = await bob.getUserId()
    requireCondition(aliceId !== bobId, 'Alice and Bob resolved to the same Supabase user.')
    ;[aliceClient, bobClient] = await Promise.all([
      signInSupabase(config.alice),
      signInSupabase(config.bob)
    ])

    const [aliceDatabaseA, aliceDatabaseB, bobDatabase] = await Promise.all([
      openPowerSyncDrizzleDatabase(directory, 'alice-a.db'),
      openPowerSyncDrizzleDatabase(directory, 'alice-b.db'),
      openPowerSyncDrizzleDatabase(directory, 'bob.db')
    ])
    databases.push(aliceDatabaseA, aliceDatabaseB, bobDatabase)
    await Promise.all([
      aliceDatabaseA.powerSync.connect(aliceA),
      aliceDatabaseB.powerSync.connect(aliceB),
      bobDatabase.powerSync.connect(bob)
    ])
    await Promise.all(
      databases.map(({ powerSync }) =>
        powerSync.waitForFirstSync({ signal: AbortSignal.timeout(45_000) })
      )
    )

    const repositoryA = new PowerSyncDrizzleEventsRepository(aliceDatabaseA.drizzle)
    const repositoryB = new PowerSyncDrizzleEventsRepository(aliceDatabaseB.drizzle)
    const bobRepository = new PowerSyncDrizzleEventsRepository(bobDatabase.drizzle)
    const event = await repositoryA.createEvent({
      ownerId: aliceId,
      title: `Drizzle cloud probe ${crypto.randomUUID()}`,
      description: 'Created offline-first on Alice device A',
      startDate: new Date('2026-11-03T09:00:00.000Z'),
      endDate: new Date('2026-11-03T11:00:00.000Z'),
      type: 'exam',
      importance: 'high',
      isMultiDay: false,
      location: 'Cloud test room'
    })
    createdEventId = event.id
    const queueAfterWrite = (await aliceDatabaseA.powerSync.getUploadQueueStats()).count
    requireCondition(queueAfterWrite > 0, 'The local Drizzle write did not enter the upload queue.')
    await waitForUploadQueue(aliceDatabaseA.powerSync)

    let replicated = await repositoryB.findByIdAndOwnerId(event.id, aliceId)
    try {
      await waitUntil(
        'Alice device B to receive the event',
        async () => {
          replicated = await repositoryB.findByIdAndOwnerId(event.id, aliceId)
          return replicated !== undefined
        },
        90_000
      )
    } catch (error) {
      const { data: serverRows, error: serverReadError } = await aliceClient
        .from('spike_events')
        .select('id')
        .eq('id', event.id)
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} ` +
          `Diagnostic: ${JSON.stringify({
            eventPresentInSupabase: !serverReadError && serverRows?.length === 1,
            serverReadError: serverReadError?.message,
            aliceA: describeSyncStatus(aliceDatabaseA.powerSync),
            aliceB: describeSyncStatus(aliceDatabaseB.powerSync),
            bob: describeSyncStatus(bobDatabase.powerSync)
          })}`
      )
    }
    requireCondition(
      replicated?.startDate instanceof Date,
      'The replicated start date is not a Date.'
    )
    requireCondition(replicated.isMultiDay === false, 'The replicated boolean was not preserved.')
    checks.push({
      name: 'typed two-device convergence',
      status: 'pass',
      evidence: {
        eventId: event.id,
        queueAfterWrite,
        queueAfterUpload: 0,
        replicatedTitle: replicated.title,
        replicatedStartDate: replicated.startDate.toISOString()
      }
    })

    const bobVisibleRows = await bobRepository.listByOwnerId(aliceId)
    requireCondition(bobVisibleRows.length === 0, 'Bob received Alice rows through PowerSync.')

    const forbiddenId = crypto.randomUUID()
    const { error: insertError } = await bobClient.from('spike_events').insert({
      id: forbiddenId,
      owner_id: aliceId,
      title: 'Forbidden Bob insert',
      start_date: '2026-11-04T09:00:00.000Z',
      end_date: '2026-11-04T10:00:00.000Z',
      type: 'other',
      importance: 'low',
      is_multi_day: false
    })
    requireCondition(insertError, 'RLS allowed Bob to insert an event owned by Alice.')

    const { data: updateRows, error: updateError } = await bobClient
      .from('spike_events')
      .update({ title: 'Forbidden Bob update' })
      .eq('id', event.id)
      .select('id')
    requireCondition(!updateError, `Bob update probe failed unexpectedly: ${updateError?.message}`)
    requireCondition(updateRows?.length === 0, 'RLS allowed Bob to update Alice event.')
    checks.push({
      name: 'cross-user read and write isolation',
      status: 'pass',
      evidence: {
        bobVisibleRows: 0,
        forbiddenInsertRejected: true,
        forbiddenUpdateRows: updateRows?.length ?? 0
      }
    })

    await repositoryA.deleteByIdAndOwnerId(event.id, aliceId)
    await waitForUploadQueue(aliceDatabaseA.powerSync)
    createdEventId = undefined
    checks.push({
      name: 'cloud cleanup through typed repository',
      status: 'pass',
      evidence: { uploadQueue: 0 }
    })

    return checks
  } finally {
    if (createdEventId && aliceClient) {
      await aliceClient.from('spike_events').delete().eq('id', createdEventId)
    }
    await Promise.allSettled(databases.map(({ powerSync }) => powerSync.close()))
    await Promise.allSettled(connectors.map((connector) => connector.signOut()))
    await Promise.allSettled(
      [aliceClient, bobClient]
        .filter((client): client is SupabaseClient => Boolean(client))
        .map((client) => client.auth.signOut({ scope: 'local' }))
    )
    await rm(directory, { recursive: true, force: true })
  }
}
