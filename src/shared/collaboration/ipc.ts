export const COLLABORATION_INVOKE_CHANNEL = 'collaboration:invoke'

export interface CollaborationState {
  configured: boolean
  signedIn: boolean
  userId: string | null
  connected: boolean
}

export interface CollaborationGroup {
  id: string
  name: string
  description: string | null
  createdBy: string
  createdAt: string
  updatedAt: string
  myRole: 'owner' | 'member'
  joinedAt: string
}

export interface CollaborationMember {
  id: string
  groupId: string
  userId: string
  role: 'owner' | 'member'
  joinedAt: string
  username: string
  displayName: string
}

export interface CollaborationInvitation {
  id: string
  groupId: string
  inviterId: string
  inviteeId: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  respondedAt: string | null
  inviterName: string | null
}

export interface CollaborationTask {
  id: string
  groupId: string
  title: string
  description: string | null
  dueDate: string | null
  assigneeId: string | null
  status: 'open' | 'done'
  createdBy: string
  updatedBy: string | null
  createdAt: string
  updatedAt: string
}

export interface CollaborationCandidate {
  id: string
  username: string
  displayName: string
}

export interface CollaborationOperations {
  state: { input: Record<string, never>; output: CollaborationState }
  signIn: { input: { email: string; password: string }; output: CollaborationState }
  signOut: { input: Record<string, never>; output: CollaborationState }
  listGroups: { input: Record<string, never>; output: CollaborationGroup[] }
  createGroup: { input: { name: string; description?: string }; output: CollaborationGroup }
  getGroup: { input: { groupId: string }; output: CollaborationGroup }
  listMembers: { input: { groupId: string }; output: CollaborationMember[] }
  searchCandidates: {
    input: { groupId: string; query: string }
    output: CollaborationCandidate[]
  }
  sendInvitation: {
    input: { groupId: string; inviteeId: string }
    output: CollaborationInvitation
  }
  listInvitations: { input: Record<string, never>; output: CollaborationInvitation[] }
  respondInvitation: {
    input: { invitationId: string; response: 'accepted' | 'declined' }
    output: CollaborationInvitation
  }
  listTasks: { input: { groupId: string }; output: CollaborationTask[] }
  createTask: {
    input: {
      groupId: string
      title: string
      description?: string | null
      dueDate?: string | null
      assigneeId?: string | null
    }
    output: CollaborationTask
  }
  updateTask: {
    input: {
      groupId: string
      taskId: string
      title?: string
      description?: string | null
      dueDate?: string | null
      assigneeId?: string | null
      status?: 'open' | 'done'
    }
    output: CollaborationTask
  }
  deleteTask: { input: { groupId: string; taskId: string }; output: { deleted: true } }
}

export type CollaborationOperation = keyof CollaborationOperations

export type CollaborationResult<T> =
  | { ok: true; data: T }
  | {
      ok: false
      error: {
        code: 'INVALID' | 'UNAUTHENTICATED' | 'OFFLINE' | 'FORBIDDEN' | 'FAILED'
        message: string
      }
    }

export type CollaborationTransport = <K extends CollaborationOperation>(
  operation: K,
  input: CollaborationOperations[K]['input']
) => Promise<CollaborationResult<CollaborationOperations[K]['output']>>
