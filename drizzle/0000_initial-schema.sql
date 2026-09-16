CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text NOT NULL,
	`study_program_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`importance` text DEFAULT 'medium' NOT NULL,
	`is_multi_day` integer DEFAULT false NOT NULL,
	`location` text,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_name` text NOT NULL,
	`grade` real,
	`ects` real NOT NULL,
	`semester` text NOT NULL,
	`passed` integer DEFAULT false NOT NULL,
	`notes` text,
	`user_id` integer NOT NULL,
	`course_id` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `preset_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`preset_id` integer NOT NULL,
	`course_name` text NOT NULL,
	`week_day` text NOT NULL,
	`time_slot` text NOT NULL,
	`room` text,
	`professor` text
);
--> statement-breakpoint
CREATE TABLE `timetable_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_name` text NOT NULL,
	`week_day` text NOT NULL,
	`time_slot` text NOT NULL,
	`room` text,
	`professor` text,
	`is_custom` integer DEFAULT true NOT NULL,
	`color` text,
	`user_id` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `timetable_presets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`faculty` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`ects` real NOT NULL,
	`semester` text NOT NULL,
	`study_program_id` integer NOT NULL,
	`is_required` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE `study_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`faculty` text NOT NULL,
	`total_ects` integer DEFAULT 180 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_activity_log` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`type` text NOT NULL,
	`description` text NOT NULL,
	`actor_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_comments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`target_type` text NOT NULL,
	`target_id` integer NOT NULL,
	`content` text NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`start_date` integer NOT NULL,
	`end_date` integer NOT NULL,
	`type` text DEFAULT 'other' NOT NULL,
	`location` text,
	`created_by` integer NOT NULL,
	`updated_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`role` text DEFAULT 'member' NOT NULL,
	`joined_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_notes` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`url` text,
	`type` text DEFAULT 'note' NOT NULL,
	`created_by` integer NOT NULL,
	`updated_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `group_tasks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`group_id` integer NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`due_date` integer,
	`assignee_id` integer,
	`status` text DEFAULT 'open' NOT NULL,
	`created_by` integer NOT NULL,
	`updated_by` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `study_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`created_by` integer NOT NULL,
	`invite_token` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
