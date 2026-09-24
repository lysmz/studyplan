import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  CollaborationGroupRow,
  CollaborationInvitationRow,
  CollaborationInvitationStatus
} from './schema'

interface RemoteGroupRow {
  id: string
  name: string
  description: string | null
  created_by: string
  created_at: string
  updated_at: string
}

interface RemoteInvitationRow {
  id: string
  group_id: string
  inviter_id: string
  invitee_id: string
  status: CollaborationInvitationStatus
  created_at: string
  responded_at: string | null
}

export interface InvitableProfile {
  id: string
  username: string
  displayName: string
}

export class CollaborationOnlineRequiredError extends Error {
  constructor() {
    super('This group operation requires an internet connection.')
    this.name = 'CollaborationOnlineRequiredError'
  }
}

function requireSingleRow<T>(data: unknown, operation: string): T {
  const candidate = Array.isArray(data) ? data[0] : data
  if (!candidate || typeof candidate !== 'object') {
    throw new Error(`${operation} did not return a row.`)
  }
  return candidate as T
}

function mapGroup(row: RemoteGroupRow): CollaborationGroupRow {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

function mapInvitation(row: RemoteInvitationRow): CollaborationInvitationRow {
  return {
    id: row.id,
    groupId: row.group_id,
    inviterId: row.inviter_id,
    inviteeId: row.invitee_id,
    status: row.status,
    createdAt: row.created_at,
    respondedAt: row.responded_at
  }
}

export class SupabaseCollaborationGateway {
  constructor(
    private readonly supabase: SupabaseClient,
    private readonly isOnline: () => boolean
  ) {}

  private requireOnline(): void {
    if (!this.isOnline()) throw new CollaborationOnlineRequiredError()
  }

  async createGroup(name: string, description?: string | null): Promise<CollaborationGroupRow> {
    this.requireOnline()
    const { data, error } = await this.supabase.rpc('create_group_with_owner', {
      p_name: name,
      p_description: description ?? null
    })
    if (error) throw new Error(`Could not create group: ${error.message}`)
    return mapGroup(requireSingleRow<RemoteGroupRow>(data, 'create_group_with_owner'))
  }

  async searchInvitableProfiles(groupId: string, query: string): Promise<InvitableProfile[]> {
    this.requireOnline()
    const { data, error } = await this.supabase.rpc('search_invitable_profiles', {
      p_group_id: groupId,
      p_query: query
    })
    if (error) throw new Error(`Could not search profiles: ${error.message}`)
    return ((data ?? []) as Array<{ id: string; username: string; display_name: string }>).map(
      (row) => ({ id: row.id, username: row.username, displayName: row.display_name })
    )
  }

  async sendInvitation(groupId: string, inviteeId: string): Promise<CollaborationInvitationRow> {
    this.requireOnline()
    const { data, error } = await this.supabase.rpc('send_group_invitation', {
      p_group_id: groupId,
      p_invitee_id: inviteeId
    })
    if (error) throw new Error(`Could not send invitation: ${error.message}`)
    return mapInvitation(requireSingleRow<RemoteInvitationRow>(data, 'send_group_invitation'))
  }

  async respondToInvitation(
    invitationId: string,
    response: 'accepted' | 'declined'
  ): Promise<CollaborationInvitationRow> {
    this.requireOnline()
    const { data, error } = await this.supabase.rpc('respond_group_invitation', {
      p_invitation_id: invitationId,
      p_response: response
    })
    if (error) throw new Error(`Could not respond to invitation: ${error.message}`)
    return mapInvitation(requireSingleRow<RemoteInvitationRow>(data, 'respond_group_invitation'))
  }
}
