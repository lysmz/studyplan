import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import type { PowerSyncDatabase } from '@powersync/node'
import {
  SupabaseCollaborationConnector,
  type CollaborationConnection,
  type CollaborationRemoteConfig
} from './connector'
import { openCollaborationDatabase, type CollaborationDatabase } from './database'
import { SupabaseCollaborationGateway } from './online-gateway'
import {
  CollaborationGroupsRepository,
  CollaborationInvitationsRepository,
  CollaborationTasksRepository
} from './repositories'

interface CollaborationCloudCheck {
  name: string
  status: 'pass'
  evidence: Record<string, unknown>
}

interface CollaborationCloudConfig {
  alice: CollaborationRemoteConfig
  bob: CollaborationRemoteConfig
}

function requireValue(value: string | undefined, name: string): string {
  const normalized = value?.trim()
  if (!normalized) throw new Error(`${name} is required for the collaboration cloud test.`)
  return normalized
}

function readCloudConfig(environment: NodeJS.ProcessEnv): CollaborationCloudConfig {
  const common = {
    powerSyncEndpoint: requireValue(
      environment.POWERSYNC_SPIKE_ENDPOINT,
      'POWERSYNC_SPIKE_ENDPOINT'
    ),
    supabaseUrl: requireValue(environment.SUPABASE_URL, 'SUPABASE_URL'),
    supabasePublishableKey: requireValue(
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
  timeoutMilliseconds = 90_000
): Promise<void> {
  const deadline = Date.now() + timeoutMilliseconds
  while (Date.now() < deadline) {
    if (await predicate()) return
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  throw new Error(`Timed out waiting for ${description}.`)
}

async function waitForUploadQueue(database: PowerSyncDatabase): Promise<void> {
  await waitUntil('the collaboration upload queue to drain', async () => {
    return (await database.getUploadQueueStats()).count === 0
  })
}

function describeSyncStatus(database: PowerSyncDatabase): Record<string, unknown> {
  const status = database.currentStatus
  return {
    message: status.getMessage(),
    connected: status.connected,
    downloading: status.downloading,
    hasSynced: status.hasSynced,
    downloadError: status.downloadError?.message,
    streams: status.syncStreams?.map(({ subscription }) => ({
      name: subscription.name,
      active: subscription.active,
      hasSynced: subscription.hasSynced
    }))
  }
}

export async function runElectronCollaborationCloudChecks(
  temporaryRoot: string,
  environment: NodeJS.ProcessEnv = process.env
): Promise<CollaborationCloudCheck[]> {
  const config = readCloudConfig(environment)
  const directory = await mkdtemp(join(temporaryRoot, 'studyplan-collaboration-cloud-'))
  const checks: CollaborationCloudCheck[] = []
  const connections: CollaborationConnection[] = []
  const databases: CollaborationDatabase[] = []
  let createdGroupId: string | undefined

  try {
    const [alice, bob] = await Promise.all([
      SupabaseCollaborationConnector.signIn(config.alice),
      SupabaseCollaborationConnector.signIn(config.bob)
    ])
    connections.push(alice, bob)
    const [aliceId, bobId] = await Promise.all([
      alice.connector.getUserId(),
      bob.connector.getUserId()
    ])
    requireCondition(aliceId !== bobId, 'Alice and Bob resolved to the same Supabase user.')

    const [aliceDatabase, bobDatabase] = await Promise.all([
      openCollaborationDatabase(directory, 'alice.db'),
      openCollaborationDatabase(directory, 'bob.db')
    ])
    databases.push(aliceDatabase, bobDatabase)
    await Promise.all([
      aliceDatabase.powerSync.connect(alice.connector),
      bobDatabase.powerSync.connect(bob.connector)
    ])
    await Promise.all(
      databases.map(({ powerSync }) =>
        powerSync.waitForFirstSync({ signal: AbortSignal.timeout(60_000) })
      )
    )

    const aliceGateway = new SupabaseCollaborationGateway(alice.supabase, () => true)
    const bobGateway = new SupabaseCollaborationGateway(bob.supabase, () => true)
    const aliceGroups = new CollaborationGroupsRepository(aliceDatabase.drizzle)
    const bobGroups = new CollaborationGroupsRepository(bobDatabase.drizzle)
    const bobInvitations = new CollaborationInvitationsRepository(bobDatabase.drizzle)
    const aliceTasks = new CollaborationTasksRepository(aliceDatabase.drizzle)
    const bobTasks = new CollaborationTasksRepository(bobDatabase.drizzle)

    const group = await aliceGateway.createGroup(
      `Cloud collaboration probe ${crypto.randomUUID().slice(0, 8)}`,
      'Disposable cloud check group'
    )
    createdGroupId = group.id
    await waitUntil('Alice to receive the created group', async () => {
      return (await aliceGroups.findByIdForUser(group.id, aliceId))?.myRole === 'owner'
    })

    const { data: bobProfile, error: bobProfileError } = await bob.supabase
      .from('profiles')
      .select('username')
      .eq('id', bobId)
      .single()
    requireCondition(!bobProfileError && bobProfile, 'Could not resolve Bob’s safe profile.')
    const candidates = await aliceGateway.searchInvitableProfiles(
      group.id,
      bobProfile.username.slice(0, Math.max(2, Math.min(8, bobProfile.username.length)))
    )
    requireCondition(
      candidates.some((candidate) => candidate.id === bobId),
      'Bob was not returned by the online invitation search.'
    )
    const invitation = await aliceGateway.sendInvitation(group.id, bobId)
    await waitUntil('Bob to receive the invitation', async () => {
      return (await bobInvitations.listPendingForInvitee(bobId)).some(
        (candidate) => candidate.id === invitation.id
      )
    })
    requireCondition(
      !(await bobGroups.findByIdForUser(group.id, bobId)),
      'Bob received group data before accepting the invitation.'
    )
    checks.push({
      name: 'online discovery and invitation delivery',
      status: 'pass',
      evidence: { groupId: group.id, invitationId: invitation.id, bobReceivedGroup: false }
    })

    await bobGateway.respondToInvitation(invitation.id, 'accepted')
    await waitUntil('Bob to receive the accepted group graph', async () => {
      return (await bobGroups.findByIdForUser(group.id, bobId))?.myRole === 'member'
    })
    await waitUntil('Alice to receive Bob’s membership', async () => {
      return (await aliceGroups.listMembers(group.id)).some((member) => member.userId === bobId)
    })
    checks.push({
      name: 'atomic invitation acceptance and membership sync',
      status: 'pass',
      evidence: { bobRole: 'member', memberCount: 2 }
    })

    await aliceDatabase.powerSync.disconnect()
    const task = await aliceTasks.create({
      groupId: group.id,
      title: 'Offline collaboration probe',
      description: 'Created while Alice PowerSync was disconnected',
      assigneeId: bobId,
      actorId: aliceId
    })
    const queueWhileOffline = (await aliceDatabase.powerSync.getUploadQueueStats()).count
    requireCondition(queueWhileOffline > 0, 'The offline task did not enter the upload queue.')
    requireCondition(
      !(await bobTasks.findByIdAndGroupId(task.id, group.id)),
      'Bob received the task while Alice was disconnected.'
    )

    await aliceDatabase.powerSync.connect(alice.connector)
    await waitForUploadQueue(aliceDatabase.powerSync)
    try {
      await waitUntil('Bob to receive Alice’s offline task', async () => {
        return (await bobTasks.findByIdAndGroupId(task.id, group.id))?.assigneeId === bobId
      })
    } catch (error) {
      throw new Error(
        `${error instanceof Error ? error.message : String(error)} ` +
          `Diagnostic: ${JSON.stringify({
            alice: describeSyncStatus(aliceDatabase.powerSync),
            bob: describeSyncStatus(bobDatabase.powerSync)
          })}`
      )
    }
    checks.push({
      name: 'offline task upload and member convergence',
      status: 'pass',
      evidence: { taskId: task.id, queueWhileOffline, queueAfterUpload: 0 }
    })

    return checks
  } catch (error) {
    if (createdGroupId && error instanceof Error) {
      error.message = `${error.message} Test group requiring cleanup: ${createdGroupId}.`
    }
    throw error
  } finally {
    await Promise.allSettled(databases.map(({ powerSync }) => powerSync.close()))
    await Promise.allSettled(connections.map(({ connector }) => connector.signOut()))
    await rm(directory, { recursive: true, force: true })
  }
}
