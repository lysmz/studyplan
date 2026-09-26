# PowerSync collaboration slice

## Scope

This implementation synchronizes exactly five tables:

- `profiles`
- `study_groups`
- `group_members`
- `group_invitations`
- `group_tasks`

Events, notes, comments, and activity logs remain outside this migration slice. The existing
integer-ID group implementation is preserved as a separate local feature; migrating its data and
UI would require a later, explicit migration step.

## Interaction boundary

- Creating a group is online-only through `create_group_with_owner`.
- Searching users is online-only through `search_invitable_profiles`. It exposes safe profile
  fields and never exposes `auth.users` or email addresses.
- Only the group owner may invite people. Sending an invitation is online-only through
  `send_group_invitation`; regular group members cannot send invitations.
- Accepting or declining an invitation is online-only through `respond_group_invitation`.
- Reading groups, memberships, profiles, invitations, and tasks uses the local PowerSync database.
- Group-task create, update, and delete operations are local-first and uploaded by the connector.
- The connector rejects queued writes to the four server-managed tables.

## Supabase deployment

The following migrations have been applied to Supabase project `repsgcypslupjhdbtcjm`:

1. `0004_create_collaboration_groups.sql`
2. `0005_allow_rls_membership_helpers.sql`
3. `0006_index_collaboration_foreign_keys.sql`
4. `20260926100612_enforce_group_task_audit_actor.sql`
5. `20260926102746_harden_group_task_uploads.sql` (remote history: `20260926104441`)

## Task audit attribution

The task-specific `BEFORE INSERT OR UPDATE` trigger derives `updated_by` from `auth.uid()`
and replaces `updated_at` with server acceptance time. Submitted actor IDs and update timestamps
are overridden. Writes without an authenticated actor are rejected, including administrative writes
without user claims. Existing membership RLS and immutable task identity checks remain in place.
The trigger uses invoker privileges; it does not bypass RLS.

Local task writes still expose provisional actor and timestamp values while offline. PowerSync
replaces them with the accepted server values after upload. `created_at` remains client-reported
creation time; `created_by` is constrained by insert RLS and immutable afterward. Existing audit
values are not retroactively verified. These fields describe the latest accepted write, not a full
activity log, and identify the authenticated account rather than the person using the device.

Run `spike/powersync-groups/supabase/tests/task-audit.sql` as the database administrator against a
test deployment with two existing Auth users. The test assumes authenticated roles for writes and
rolls back its disposable fixtures. It checks forged insert/update actors and timestamps, immutable
identity fields, non-member access, anonymous access, and missing actor rejection. The regression
failed before the migration with `Forged insert actor was accepted` and passed after deployment.
The extended cloud harness passed offline task editing and convergence of the authoritative actor
and server timestamp on both clients. The local durability smoke test, typecheck, and focused lint
also passed. The disposable cloud test group was removed after verifying its exact ID and name.
The security advisor reported only the previously documented RPC and password-protection warnings.

## Deployment security notes

All public tables have RLS enabled. The four security-definer RPCs are intentionally executable
only by authenticated users, validate `auth.uid()`, use an empty `search_path`, and perform their
authorization checks internally.

The Supabase security advisor reports these four RPCs as callable security-definer functions.
That access is intentional for atomic group creation and invitation handling; each function checks
the caller's identity and group role. The advisor also reports that leaked-password protection is
disabled for this disposable Auth project. It should be enabled before treating the deployment as
production-ready. No new table was reported without RLS.

## PowerSync deployment

`spike/powersync-groups/sync-streams-v4.yaml` matches the configuration deployed in PowerSync.
It uses the `user_groups` parameter and `IN user_groups` filters accepted by the dashboard. It
replaces the older `spike_tasks` and `spike_events` streams.

The two-user cloud test passed against the deployed streams. It proved:

1. Alice creates a group and invites Bob online.
2. Bob receives the invitation through PowerSync.
3. Bob accepts online and then receives the group graph.
4. Alice creates a task offline and it uploads after reconnection; Bob receives it.
5. An invited non-member does not receive the group's data before acceptance.

Separate authenticated SQL checks confirmed that an invited non-member could not read the group,
write a group task, or search invitation candidates.

The test group created during the successful run was removed manually from the disposable Supabase
project after verifying its exact ID. The cloud harness reports any future test group ID for cleanup.

The test can be rerun with `npm run powersync:groups:cloud` after filling the Git-ignored
`.env.powersync-groups.local` file from `.env.powersync-groups.example`. The local offline check is
`npm run powersync:groups:test`. Neither check requires a service-role key.

## Upload correctness hardening

Task uploads now use an authenticated, invoker-privilege `upload_group_task` RPC. A private receipt
commits with each task operation; repeating that operation returns its earlier result without
reapplying it. Missing/inaccessible PATCH targets are explicit rejections. A rejected draft is saved
in the local-only `collaboration_upload_failures` table before queue acknowledgement; unrelated
tasks can then upload. The UI exposes pending and rejected counts plus preserved draft details.

The fast command is `npm run collaboration:test`. The existing local/cloud commands now also cover
journal persistence, forced process exit, replay and deterministic lost responses. The deployment,
baseline failures, passing evidence and remaining repository lint backlog are recorded in
[p1-hardening-results.md](p1-hardening-results.md). There are still five synchronized domain tables;
the private receipts and local rejection journal are separate metadata.

## Desktop prototype

The new `/gruppen-sync` screen is separate from the existing local integer-ID group UI. StudyPlan's
local account still controls the app; users sign in to Supabase for synchronized groups. The main
process keeps the Supabase session and opens a different PowerSync database file for each Supabase
user. Logging out of the local app also closes the online session. Cloud sessions are currently
in-memory, so the user must sign in again after restarting the app. This is a known prototype limit,
not a claim of full offline login after restart.

The screen supports online group creation, online profile search and invitations, online acceptance
or rejection, and local-first group-task CRUD. It reads groups, members, invitations and tasks from
the local synchronized database. Existing local groups are not migrated by this slice.
