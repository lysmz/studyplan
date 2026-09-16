import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const groupRoleEnum = pgEnum("group_role", ["owner", "member"]);
export const taskStatusEnum = pgEnum("task_status", ["open", "done"]);
export const noteTypeEnum = pgEnum("note_type", ["note", "link"]);
export const groupActivityTypeEnum = pgEnum("group_activity_type", [
  "event_created",
  "event_updated",
  "event_deleted",
  "task_created",
  "task_updated",
  "task_completed",
  "note_created",
  "member_joined",
  "member_left",
]);
export const commentTargetTypeEnum = pgEnum("comment_target_type", ["event", "task"]);

export const studyGroupsTable = pgTable("study_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull(),
  inviteToken: uuid("invite_token").defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupMembersTable = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  role: groupRoleEnum("role").notNull().default("member"),
  joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupEventsTable = pgTable("group_events", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  type: text("type").notNull().default("other"),
  location: text("location"),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const groupTasksTable = pgTable("group_tasks", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  assigneeId: integer("assignee_id"),
  status: taskStatusEnum("status").notNull().default("open"),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const groupNotesTable = pgTable("group_notes", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"),
  type: noteTypeEnum("type").notNull().default("note"),
  createdBy: integer("created_by").notNull(),
  updatedBy: integer("updated_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const groupCommentsTable = pgTable("group_comments", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  targetType: commentTargetTypeEnum("target_type").notNull(),
  targetId: integer("target_id").notNull(),
  content: text("content").notNull(),
  createdBy: integer("created_by").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const groupActivityLogTable = pgTable("group_activity_log", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  type: groupActivityTypeEnum("type").notNull(),
  description: text("description").notNull(),
  actorId: integer("actor_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertStudyGroupSchema = createInsertSchema(studyGroupsTable).omit({ id: true, createdAt: true, inviteToken: true });
export const insertGroupMemberSchema = createInsertSchema(groupMembersTable).omit({ id: true, joinedAt: true });
export const insertGroupEventSchema = createInsertSchema(groupEventsTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupTaskSchema = createInsertSchema(groupTasksTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupNoteSchema = createInsertSchema(groupNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export const insertGroupCommentSchema = createInsertSchema(groupCommentsTable).omit({ id: true, createdAt: true });
export const insertGroupActivityLogSchema = createInsertSchema(groupActivityLogTable).omit({ id: true, createdAt: true });

export type StudyGroup = typeof studyGroupsTable.$inferSelect;
export type GroupMember = typeof groupMembersTable.$inferSelect;
export type GroupEvent = typeof groupEventsTable.$inferSelect;
export type GroupTask = typeof groupTasksTable.$inferSelect;
export type GroupNote = typeof groupNotesTable.$inferSelect;
export type GroupComment = typeof groupCommentsTable.$inferSelect;
