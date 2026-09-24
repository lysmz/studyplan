import type { PowerSyncSQLiteDatabase } from '@powersync/drizzle-driver'
import { and, asc, eq, inArray } from 'drizzle-orm'
import {
  collaborationGroupMembersTable,
  collaborationGroupsTable,
  collaborationInvitationsTable,
  collaborationProfilesTable,
  collaborationTasksTable,
  powerSyncCollaborationSchemaDefinition,
  type CollaborationGroupMemberRow,
  type CollaborationGroupRow,
  type CollaborationInvitationRow,
  type CollaborationProfileRow,
  type CollaborationTaskRow,
  type CollaborationTaskStatus
} from './schema'

type CollaborationDrizzleDatabase = PowerSyncSQLiteDatabase<
  typeof powerSyncCollaborationSchemaDefinition
>

export interface CollaborationGroupSummary extends CollaborationGroupRow {
  myRole: CollaborationGroupMemberRow['role']
  joinedAt: string
}

export interface CollaborationGroupMember extends CollaborationGroupMemberRow {
  username: string
  displayName: string
}

export interface CreateCollaborationTask {
  groupId: string
  title: string
  description?: string | null
  dueDate?: Date | null
  assigneeId?: string | null
  status?: CollaborationTaskStatus
  actorId: string
}

export interface UpdateCollaborationTask {
  title?: string
  description?: string | null
  dueDate?: Date | null
  assigneeId?: string | null
  status?: CollaborationTaskStatus
}

export class CollaborationProfilesRepository {
  constructor(private readonly database: CollaborationDrizzleDatabase) {}

  async findById(id: string): Promise<CollaborationProfileRow | undefined> {
    const [profile] = await this.database
      .select()
      .from(collaborationProfilesTable)
      .where(eq(collaborationProfilesTable.id, id))
      .limit(1)
    return profile
  }

  async findByIds(ids: string[]): Promise<CollaborationProfileRow[]> {
    if (ids.length === 0) return []
    return this.database
      .select()
      .from(collaborationProfilesTable)
      .where(inArray(collaborationProfilesTable.id, ids))
  }
}

export class CollaborationGroupsRepository {
  constructor(private readonly database: CollaborationDrizzleDatabase) {}

  async listForUser(userId: string): Promise<CollaborationGroupSummary[]> {
    const rows = await this.database
      .select({
        group: collaborationGroupsTable,
        role: collaborationGroupMembersTable.role,
        joinedAt: collaborationGroupMembersTable.joinedAt
      })
      .from(collaborationGroupMembersTable)
      .innerJoin(
        collaborationGroupsTable,
        eq(collaborationGroupsTable.id, collaborationGroupMembersTable.groupId)
      )
      .where(eq(collaborationGroupMembersTable.userId, userId))
      .orderBy(asc(collaborationGroupsTable.name))

    return rows.map(({ group, role, joinedAt }) => ({ ...group, myRole: role, joinedAt }))
  }

  async findByIdForUser(
    groupId: string,
    userId: string
  ): Promise<CollaborationGroupSummary | undefined> {
    const [row] = await this.database
      .select({
        group: collaborationGroupsTable,
        role: collaborationGroupMembersTable.role,
        joinedAt: collaborationGroupMembersTable.joinedAt
      })
      .from(collaborationGroupMembersTable)
      .innerJoin(
        collaborationGroupsTable,
        eq(collaborationGroupsTable.id, collaborationGroupMembersTable.groupId)
      )
      .where(
        and(
          eq(collaborationGroupMembersTable.groupId, groupId),
          eq(collaborationGroupMembersTable.userId, userId)
        )
      )
      .limit(1)

    return row ? { ...row.group, myRole: row.role, joinedAt: row.joinedAt } : undefined
  }

  async listMembers(groupId: string): Promise<CollaborationGroupMember[]> {
    const rows = await this.database
      .select({
        membership: collaborationGroupMembersTable,
        username: collaborationProfilesTable.username,
        displayName: collaborationProfilesTable.displayName
      })
      .from(collaborationGroupMembersTable)
      .innerJoin(
        collaborationProfilesTable,
        eq(collaborationProfilesTable.id, collaborationGroupMembersTable.userId)
      )
      .where(eq(collaborationGroupMembersTable.groupId, groupId))
      .orderBy(asc(collaborationProfilesTable.displayName))

    return rows.map(({ membership, username, displayName }) => ({
      ...membership,
      username,
      displayName
    }))
  }
}

export class CollaborationInvitationsRepository {
  constructor(private readonly database: CollaborationDrizzleDatabase) {}

  async listPendingForInvitee(inviteeId: string): Promise<CollaborationInvitationRow[]> {
    return this.database
      .select()
      .from(collaborationInvitationsTable)
      .where(
        and(
          eq(collaborationInvitationsTable.inviteeId, inviteeId),
          eq(collaborationInvitationsTable.status, 'pending')
        )
      )
      .orderBy(asc(collaborationInvitationsTable.createdAt))
  }

  async listPendingSentBy(inviterId: string): Promise<CollaborationInvitationRow[]> {
    return this.database
      .select()
      .from(collaborationInvitationsTable)
      .where(
        and(
          eq(collaborationInvitationsTable.inviterId, inviterId),
          eq(collaborationInvitationsTable.status, 'pending')
        )
      )
      .orderBy(asc(collaborationInvitationsTable.createdAt))
  }
}

export class CollaborationTasksRepository {
  constructor(private readonly database: CollaborationDrizzleDatabase) {}

  async listByGroupId(groupId: string): Promise<CollaborationTaskRow[]> {
    return this.database
      .select()
      .from(collaborationTasksTable)
      .where(eq(collaborationTasksTable.groupId, groupId))
      .orderBy(asc(collaborationTasksTable.status), asc(collaborationTasksTable.dueDate))
  }

  async findByIdAndGroupId(
    taskId: string,
    groupId: string
  ): Promise<CollaborationTaskRow | undefined> {
    const [task] = await this.database
      .select()
      .from(collaborationTasksTable)
      .where(
        and(eq(collaborationTasksTable.id, taskId), eq(collaborationTasksTable.groupId, groupId))
      )
      .limit(1)
    return task
  }

  async create(values: CreateCollaborationTask): Promise<CollaborationTaskRow> {
    const timestamp = new Date().toISOString()
    const [task] = await this.database
      .insert(collaborationTasksTable)
      .values({
        id: crypto.randomUUID(),
        groupId: values.groupId,
        title: values.title.trim(),
        description: values.description ?? null,
        dueDate: values.dueDate?.toISOString() ?? null,
        assigneeId: values.assigneeId ?? null,
        status: values.status ?? 'open',
        createdBy: values.actorId,
        updatedBy: values.actorId,
        createdAt: timestamp,
        updatedAt: timestamp
      })
      .returning()
    if (!task) throw new Error('PowerSync did not return the created group task.')
    return task
  }

  async update(
    taskId: string,
    groupId: string,
    actorId: string,
    changes: UpdateCollaborationTask
  ): Promise<CollaborationTaskRow | undefined> {
    if (Object.keys(changes).length === 0) return this.findByIdAndGroupId(taskId, groupId)

    const rowChanges: Partial<typeof collaborationTasksTable.$inferInsert> = {
      updatedBy: actorId,
      updatedAt: new Date().toISOString()
    }
    if (changes.title !== undefined) rowChanges.title = changes.title.trim()
    if (changes.description !== undefined) rowChanges.description = changes.description
    if (changes.dueDate !== undefined) rowChanges.dueDate = changes.dueDate?.toISOString() ?? null
    if (changes.assigneeId !== undefined) rowChanges.assigneeId = changes.assigneeId
    if (changes.status !== undefined) rowChanges.status = changes.status

    const [task] = await this.database
      .update(collaborationTasksTable)
      .set(rowChanges)
      .where(
        and(eq(collaborationTasksTable.id, taskId), eq(collaborationTasksTable.groupId, groupId))
      )
      .returning()
    return task
  }

  async delete(taskId: string, groupId: string): Promise<CollaborationTaskRow | undefined> {
    const [task] = await this.database
      .delete(collaborationTasksTable)
      .where(
        and(eq(collaborationTasksTable.id, taskId), eq(collaborationTasksTable.groupId, groupId))
      )
      .returning()
    return task
  }
}
