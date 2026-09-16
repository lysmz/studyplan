import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'
import { createInsertSchema } from 'drizzle-zod'

export const groupRoles = ['owner', 'member'] as const
export type GroupRole = (typeof groupRoles)[number]

export const taskStatuses = ['open', 'done'] as const
export type TaskStatus = (typeof taskStatuses)[number]

export const noteTypes = ['note', 'link'] as const
export type NoteType = (typeof noteTypes)[number]

export const groupActivityTypes = [
  'event_created',
  'event_updated',
  'event_deleted',
  'task_created',
  'task_updated',
  'task_completed',
  'note_created',
  'member_joined',
  'member_left'
] as const
export type GroupActivityType = (typeof groupActivityTypes)[number]

export const commentTargetTypes = ['event', 'task'] as const
export type CommentTargetType = (typeof commentTargetTypes)[number]

export const studyGroupsTable = sqliteTable('study_groups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  description: text('description'),
  createdBy: integer('created_by').notNull(),
  inviteToken: text('invite_token')
    .notNull()
    .$defaultFn(() => crypto.randomUUID()),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

export const groupMembersTable = sqliteTable('group_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  userId: integer('user_id').notNull(),
  role: text('role', { enum: groupRoles }).notNull().default('member'),
  joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

export const groupEventsTable = sqliteTable('group_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  startDate: integer('start_date', { mode: 'timestamp' }).notNull(),
  endDate: integer('end_date', { mode: 'timestamp' }).notNull(),
  type: text('type').notNull().default('other'),
  location: text('location'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export const groupTasksTable = sqliteTable('group_tasks', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: integer('due_date', { mode: 'timestamp' }),
  assigneeId: integer('assignee_id'),
  status: text('status', { enum: taskStatuses }).notNull().default('open'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export const groupNotesTable = sqliteTable('group_notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  title: text('title').notNull(),
  content: text('content'),
  url: text('url'),
  type: text('type', { enum: noteTypes }).notNull().default('note'),
  createdBy: integer('created_by').notNull(),
  updatedBy: integer('updated_by'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`)
    .$onUpdate(() => new Date())
})

export const groupCommentsTable = sqliteTable('group_comments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  targetType: text('target_type', { enum: commentTargetTypes }).notNull(),
  targetId: integer('target_id').notNull(),
  content: text('content').notNull(),
  createdBy: integer('created_by').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

export const groupActivityLogTable = sqliteTable('group_activity_log', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  groupId: integer('group_id').notNull(),
  type: text('type', { enum: groupActivityTypes }).notNull(),
  description: text('description').notNull(),
  actorId: integer('actor_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`)
})

export const insertStudyGroupSchema = createInsertSchema(studyGroupsTable).omit({
  id: true,
  createdAt: true,
  inviteToken: true
})
export const insertGroupMemberSchema = createInsertSchema(groupMembersTable).omit({
  id: true,
  joinedAt: true
})
export const insertGroupEventSchema = createInsertSchema(groupEventsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export const insertGroupTaskSchema = createInsertSchema(groupTasksTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export const insertGroupNoteSchema = createInsertSchema(groupNotesTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true
})
export const insertGroupCommentSchema = createInsertSchema(groupCommentsTable).omit({
  id: true,
  createdAt: true
})
export const insertGroupActivityLogSchema = createInsertSchema(groupActivityLogTable).omit({
  id: true,
  createdAt: true
})

export type StudyGroup = typeof studyGroupsTable.$inferSelect
export type GroupMember = typeof groupMembersTable.$inferSelect
export type GroupEvent = typeof groupEventsTable.$inferSelect
export type GroupTask = typeof groupTasksTable.$inferSelect
export type GroupNote = typeof groupNotesTable.$inferSelect
export type GroupComment = typeof groupCommentsTable.$inferSelect
