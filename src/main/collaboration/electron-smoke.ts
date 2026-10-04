import { mkdtemp, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { runUploadQueueChecks } from './upload-smoke'
import type { SupabaseClient } from '@supabase/supabase-js'
import { openCollaborationDatabase, type CollaborationDatabase } from './database'
import { CollaborationOnlineRequiredError, SupabaseCollaborationGateway } from './online-gateway'
import {
  CollaborationGroupsRepository,
  CollaborationInvitationsRepository,
  CollaborationProfilesRepository,
  CollaborationTasksRepository
} from './repositories'
import {
  collaborationGroupMembersTable,
  collaborationGroupsTable,
  collaborationInvitationsTable,
  collaborationProfilesTable
} from './schema'

interface CollaborationCheck {
  name: string
  status: 'pass'
  evidence: Record<string, unknown>
}

function requireCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

export async function runElectronCollaborationChecks(
  temporaryRoot: string
): Promise<CollaborationCheck[]> {
  const directory = await mkdtemp(join(temporaryRoot, 'studyplan-collaboration-'))
  const checks: CollaborationCheck[] = []
  const aliceId = '11111111-1111-4111-8111-111111111111'
  const bobId = '22222222-2222-4222-8222-222222222222'
  const groupId = '33333333-3333-4333-8333-333333333333'
  let database: CollaborationDatabase | undefined

  try {
    database = await openCollaborationDatabase(directory, 'collaboration.db')
    const timestamp = new Date('2026-09-20T10:00:00.000Z').toISOString()
    await database.drizzle.insert(collaborationProfilesTable).values([
      {
        id: aliceId,
        username: 'alice_local',
        displayName: 'Alice',
        discoverable: true,
        createdAt: timestamp,
        updatedAt: timestamp
      },
      {
        id: bobId,
        username: 'bob_local',
        displayName: 'Bob',
        discoverable: true,
        createdAt: timestamp,
        updatedAt: timestamp
      }
    ])
    await database.drizzle.insert(collaborationGroupsTable).values({
      id: groupId,
      name: 'Distributed Systems',
      description: 'Local-first study group',
      createdBy: aliceId,
      createdAt: timestamp,
      updatedAt: timestamp
    })
    await database.drizzle.insert(collaborationGroupMembersTable).values([
      {
        id: '44444444-4444-4444-8444-444444444444',
        groupId,
        userId: aliceId,
        role: 'owner',
        joinedAt: timestamp
      },
      {
        id: '55555555-5555-4555-8555-555555555555',
        groupId,
        userId: bobId,
        role: 'member',
        joinedAt: timestamp
      }
    ])
    await database.drizzle.insert(collaborationInvitationsTable).values({
      id: '66666666-6666-4666-8666-666666666666',
      groupId,
      inviterId: aliceId,
      inviteeId: bobId,
      status: 'pending',
      createdAt: timestamp,
      respondedAt: null
    })

    const profiles = new CollaborationProfilesRepository(database.drizzle)
    const groups = new CollaborationGroupsRepository(database.drizzle)
    const invitations = new CollaborationInvitationsRepository(database.drizzle)
    const tasks = new CollaborationTasksRepository(database.drizzle)

    const aliceGroups = await groups.listForUser(aliceId)
    const members = await groups.listMembers(groupId)
    const bobInvitations = await invitations.listPendingForInvitee(bobId)
    const bobProfile = await profiles.findById(bobId)
    requireCondition(
      aliceGroups.length === 1 && aliceGroups[0].myRole === 'owner',
      'The local group/membership join failed.'
    )
    requireCondition(members.length === 2, 'The locally synchronized member list failed.')
    requireCondition(
      bobInvitations.length === 1 && bobProfile?.displayName === 'Bob',
      'The local invitation/profile lookup failed.'
    )
    checks.push({
      name: 'read synchronized group graph while offline',
      status: 'pass',
      evidence: { groups: aliceGroups.length, members: members.length, invitations: 1 }
    })

    const task = await tasks.create({
      groupId,
      title: 'Prepare synchronization notes',
      dueDate: new Date('2026-10-01T12:00:00.000Z'),
      assigneeId: bobId,
      actorId: aliceId
    })
    const updated = await tasks.update(task.id, groupId, bobId, { status: 'done' })
    requireCondition(updated?.status === 'done', 'The offline task update failed.')
    const queuedBeforeRestart = (await database.powerSync.getUploadQueueStats()).count
    await database.powerSync.close()

    database = await openCollaborationDatabase(directory, 'collaboration.db')
    const reopenedTasks = new CollaborationTasksRepository(database.drizzle)
    const persisted = await reopenedTasks.findByIdAndGroupId(task.id, groupId)
    const queuedAfterRestart = (await database.powerSync.getUploadQueueStats()).count
    requireCondition(persisted?.status === 'done', 'The offline task did not survive restart.')
    requireCondition(
      queuedBeforeRestart > 0 && queuedAfterRestart === queuedBeforeRestart,
      'The collaboration upload queue did not survive restart.'
    )
    checks.push({
      name: 'offline group task durability',
      status: 'pass',
      evidence: { taskId: task.id, queuedBeforeRestart, queuedAfterRestart }
    })

    const offlineGateway = new SupabaseCollaborationGateway({} as SupabaseClient, () => false)
    let refusedOfflineInvite = false
    try {
      await offlineGateway.sendInvitation(groupId, bobId)
    } catch (error) {
      refusedOfflineInvite = error instanceof CollaborationOnlineRequiredError
    }
    requireCondition(refusedOfflineInvite, 'The gateway did not reject an offline invitation.')
    checks.push({
      name: 'online-only invitation boundary',
      status: 'pass',
      evidence: { offlineInvitationRejected: true }
    })

    checks.push(...(await runUploadQueueChecks(temporaryRoot)))
    return checks
  } finally {
    await database?.powerSync.close().catch(() => undefined)
    await rm(directory, { recursive: true, force: true })
  }
}
