import { DrizzleAppSchema } from '@powersync/drizzle-driver'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const collaborationGroupRoles = ['owner', 'member'] as const
export type CollaborationGroupRole = (typeof collaborationGroupRoles)[number]

export const collaborationInvitationStatuses = ['pending', 'accepted', 'declined'] as const
export type CollaborationInvitationStatus = (typeof collaborationInvitationStatuses)[number]

export const collaborationTaskStatuses = ['open', 'done'] as const
export type CollaborationTaskStatus = (typeof collaborationTaskStatuses)[number]

export const collaborationProfilesTable = sqliteTable(
  'profiles',
  {
    id: text('id').primaryKey().notNull(),
    username: text('username').notNull(),
    displayName: text('display_name').notNull(),
    discoverable: integer('discoverable', { mode: 'boolean' }).notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [uniqueIndex('collaboration_profiles_username_idx').on(table.username)]
)

export const collaborationGroupsTable = sqliteTable(
  'study_groups',
  {
    id: text('id').primaryKey().notNull(),
    name: text('name').notNull(),
    description: text('description'),
    createdBy: text('created_by').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [index('collaboration_groups_created_by_idx').on(table.createdBy)]
)

export const collaborationGroupMembersTable = sqliteTable(
  'group_members',
  {
    id: text('id').primaryKey().notNull(),
    groupId: text('group_id').notNull(),
    userId: text('user_id').notNull(),
    role: text('role', { enum: collaborationGroupRoles }).notNull(),
    joinedAt: text('joined_at').notNull()
  },
  (table) => [
    uniqueIndex('collaboration_group_members_group_user_idx').on(table.groupId, table.userId),
    index('collaboration_group_members_user_idx').on(table.userId)
  ]
)

export const collaborationInvitationsTable = sqliteTable(
  'group_invitations',
  {
    id: text('id').primaryKey().notNull(),
    groupId: text('group_id').notNull(),
    inviterId: text('inviter_id').notNull(),
    inviteeId: text('invitee_id').notNull(),
    status: text('status', { enum: collaborationInvitationStatuses }).notNull(),
    createdAt: text('created_at').notNull(),
    respondedAt: text('responded_at')
  },
  (table) => [
    index('collaboration_invitations_invitee_idx').on(table.inviteeId, table.status),
    index('collaboration_invitations_inviter_idx').on(table.inviterId, table.status)
  ]
)

export const collaborationTasksTable = sqliteTable(
  'group_tasks',
  {
    id: text('id').primaryKey().notNull(),
    groupId: text('group_id').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    dueDate: text('due_date'),
    assigneeId: text('assignee_id'),
    status: text('status', { enum: collaborationTaskStatuses }).notNull(),
    createdBy: text('created_by').notNull(),
    updatedBy: text('updated_by'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull()
  },
  (table) => [
    index('collaboration_tasks_group_idx').on(table.groupId),
    index('collaboration_tasks_assignee_idx').on(table.assigneeId)
  ]
)

export const powerSyncCollaborationSchemaDefinition = {
  collaborationProfilesTable,
  collaborationGroupsTable,
  collaborationGroupMembersTable,
  collaborationInvitationsTable,
  collaborationTasksTable
}

export const powerSyncCollaborationSchema = new DrizzleAppSchema(
  powerSyncCollaborationSchemaDefinition
)

export type CollaborationProfileRow = typeof collaborationProfilesTable.$inferSelect
export type CollaborationGroupRow = typeof collaborationGroupsTable.$inferSelect
export type CollaborationGroupMemberRow = typeof collaborationGroupMembersTable.$inferSelect
export type CollaborationInvitationRow = typeof collaborationInvitationsTable.$inferSelect
export type CollaborationTaskRow = typeof collaborationTasksTable.$inferSelect
