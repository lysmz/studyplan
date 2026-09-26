import { join } from 'node:path'
import { net } from 'electron'
import type { CollaborationInvitation, CollaborationState } from '../../shared/collaboration/ipc'
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
  CollaborationProfilesRepository,
  CollaborationTasksRepository,
  type CollaborationGroupMember,
  type CollaborationGroupSummary,
  type CreateCollaborationTask,
  type UpdateCollaborationTask
} from './repositories'
import type { InvitableProfile } from './online-gateway'
import type { CollaborationTaskRow } from './schema'
import { LocalUploadFailureStore } from './upload-failures'

export class CollaborationSessionRequiredError extends Error {
  constructor() {
    super('Sign in to your Supabase account to use synchronized groups.')
    this.name = 'CollaborationSessionRequiredError'
  }
}

export class CollaborationMembershipRequiredError extends Error {
  constructor() {
    super('You are not a member of this synchronized group.')
    this.name = 'CollaborationMembershipRequiredError'
  }
}

interface ActiveCollaborationSession {
  userId: string
  connection: CollaborationConnection
  database: CollaborationDatabase
  gateway: SupabaseCollaborationGateway
  groups: CollaborationGroupsRepository
  invitations: CollaborationInvitationsRepository
  profiles: CollaborationProfilesRepository
  tasks: CollaborationTasksRepository
}

function readRemoteConfig(
  email: string,
  password: string,
  environment: NodeJS.ProcessEnv
): CollaborationRemoteConfig {
  const powerSyncEndpoint = environment.POWERSYNC_SPIKE_ENDPOINT?.trim()
  const supabaseUrl = environment.SUPABASE_URL?.trim()
  const supabasePublishableKey = (
    environment.SUPABASE_PUBLISHABLE_KEY ?? environment.SUPABASE_ANON_KEY
  )?.trim()
  if (!powerSyncEndpoint || !supabaseUrl || !supabasePublishableKey) {
    throw new Error('Configure PowerSync and Supabase before using synchronized groups.')
  }
  return { powerSyncEndpoint, supabaseUrl, supabasePublishableKey, email, password }
}

export class CollaborationRuntime {
  private active: ActiveCollaborationSession | null = null

  constructor(
    private readonly userDataDirectory: string,
    private readonly environment: NodeJS.ProcessEnv = process.env
  ) {}

  async state(): Promise<CollaborationState> {
    const configured = Boolean(
      this.environment.POWERSYNC_SPIKE_ENDPOINT?.trim() &&
      this.environment.SUPABASE_URL?.trim() &&
      (this.environment.SUPABASE_PUBLISHABLE_KEY ?? this.environment.SUPABASE_ANON_KEY)?.trim()
    )
    const active = this.active
    const uploadFailures = active
      ? await new LocalUploadFailureStore(active.database.powerSync, active.userId).list()
      : []
    const pendingUploads = active
      ? (await active.database.powerSync.getUploadQueueStats()).count
      : 0
    return {
      configured,
      signedIn: active !== null,
      userId: active?.userId ?? null,
      connected: active?.database.powerSync.currentStatus.connected ?? false,
      pendingUploads,
      rejectedUploads: uploadFailures.length,
      uploadError: active?.database.powerSync.currentStatus.uploadError
        ? 'Aufgaben konnten noch nicht übertragen werden. Sie bleiben lokal gespeichert.'
        : null,
      uploadFailures
    }
  }

  async signIn(email: string, password: string): Promise<CollaborationState> {
    const config = readRemoteConfig(email, password, this.environment)
    await this.signOut()
    const connection = await SupabaseCollaborationConnector.signIn(config)
    let database: CollaborationDatabase | undefined
    try {
      const userId = await connection.connector.getUserId()
      const directory = join(this.userDataDirectory, 'collaboration')
      database = await openCollaborationDatabase(directory, `collaboration-${userId}.db`)
      const gateway = new SupabaseCollaborationGateway(connection.supabase, () => net.isOnline())
      await database.powerSync.connect(connection.connector)
      this.active = {
        userId,
        connection,
        database,
        gateway,
        groups: new CollaborationGroupsRepository(database.drizzle),
        invitations: new CollaborationInvitationsRepository(database.drizzle),
        profiles: new CollaborationProfilesRepository(database.drizzle),
        tasks: new CollaborationTasksRepository(database.drizzle)
      }
      return this.state()
    } catch (error) {
      await database?.powerSync.close().catch(() => undefined)
      await connection.connector.signOut().catch(() => undefined)
      throw error
    }
  }

  async signOut(): Promise<CollaborationState> {
    const active = this.active
    this.active = null
    if (active) {
      await active.database.powerSync.close()
      await active.connection.connector.signOut()
    }
    return this.state()
  }

  async close(): Promise<void> {
    await this.signOut()
  }

  private requireSession(): ActiveCollaborationSession {
    if (!this.active) throw new CollaborationSessionRequiredError()
    return this.active
  }

  private async requireMembership(groupId: string): Promise<ActiveCollaborationSession> {
    const active = this.requireSession()
    if (!(await active.groups.findByIdForUser(groupId, active.userId))) {
      throw new CollaborationMembershipRequiredError()
    }
    return active
  }

  async listGroups(): Promise<CollaborationGroupSummary[]> {
    const active = this.requireSession()
    return active.groups.listForUser(active.userId)
  }

  async createGroup(name: string, description?: string): Promise<CollaborationGroupSummary> {
    const active = this.requireSession()
    const group = await active.gateway.createGroup(name, description)
    return { ...group, myRole: 'owner' as const, joinedAt: group.createdAt }
  }

  async getGroup(groupId: string): Promise<CollaborationGroupSummary> {
    const active = await this.requireMembership(groupId)
    const group = await active.groups.findByIdForUser(groupId, active.userId)
    if (!group) throw new CollaborationMembershipRequiredError()
    return group
  }

  async listMembers(groupId: string): Promise<CollaborationGroupMember[]> {
    const active = await this.requireMembership(groupId)
    return active.groups.listMembers(groupId)
  }

  async searchCandidates(groupId: string, query: string): Promise<InvitableProfile[]> {
    const active = await this.requireMembership(groupId)
    return active.gateway.searchInvitableProfiles(groupId, query)
  }

  async sendInvitation(groupId: string, inviteeId: string): Promise<CollaborationInvitation> {
    const active = await this.requireMembership(groupId)
    const invitation = await active.gateway.sendInvitation(groupId, inviteeId)
    return { ...invitation, inviterName: null }
  }

  async listInvitations(): Promise<CollaborationInvitation[]> {
    const active = this.requireSession()
    const invitations = await active.invitations.listPendingForInvitee(active.userId)
    const profiles = await active.profiles.findByIds(
      invitations.map((invitation) => invitation.inviterId)
    )
    const names = new Map(profiles.map((profile) => [profile.id, profile.displayName]))
    return invitations.map((invitation) => ({
      ...invitation,
      inviterName: names.get(invitation.inviterId) ?? null
    }))
  }

  async respondInvitation(
    invitationId: string,
    response: 'accepted' | 'declined'
  ): Promise<CollaborationInvitation> {
    const active = this.requireSession()
    const invitation = await active.gateway.respondToInvitation(invitationId, response)
    return { ...invitation, inviterName: null }
  }

  async listTasks(groupId: string): Promise<CollaborationTaskRow[]> {
    const active = await this.requireMembership(groupId)
    return active.tasks.listByGroupId(groupId)
  }

  async createTask(
    values: Omit<CreateCollaborationTask, 'actorId'>
  ): Promise<CollaborationTaskRow> {
    const active = await this.requireMembership(values.groupId)
    await this.requireAssigneeMembership(active, values.groupId, values.assigneeId)
    return active.tasks.create({ ...values, actorId: active.userId })
  }

  async updateTask(
    taskId: string,
    groupId: string,
    changes: UpdateCollaborationTask
  ): Promise<CollaborationTaskRow> {
    const active = await this.requireMembership(groupId)
    await this.requireAssigneeMembership(active, groupId, changes.assigneeId)
    const task = await active.tasks.update(taskId, groupId, active.userId, changes)
    if (!task) throw new Error('Group task not found.')
    return task
  }

  async deleteTask(taskId: string, groupId: string): Promise<{ deleted: true }> {
    const active = await this.requireMembership(groupId)
    const task = await active.tasks.delete(taskId, groupId)
    if (!task) throw new Error('Group task not found.')
    return { deleted: true as const }
  }

  private async requireAssigneeMembership(
    active: ActiveCollaborationSession,
    groupId: string,
    assigneeId: string | null | undefined
  ): Promise<void> {
    if (!assigneeId) return
    const members = await active.groups.listMembers(groupId)
    if (!members.some((member) => member.userId === assigneeId)) {
      throw new CollaborationMembershipRequiredError()
    }
  }
}
