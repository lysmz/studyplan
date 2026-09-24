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
- Sending an invitation is online-only through `send_group_invitation`.
- Accepting or declining an invitation is online-only through `respond_group_invitation`.
- Reading groups, memberships, profiles, invitations, and tasks uses the local PowerSync database.
- Group-task create, update, and delete operations are local-first and uploaded by the connector.
- The connector rejects queued writes to the four server-managed tables.

## Supabase deployment

The following migrations have been applied to Supabase project `repsgcypslupjhdbtcjm`:

1. `0004_create_collaboration_groups.sql`
2. `0005_allow_rls_membership_helpers.sql`
3. `0006_index_collaboration_foreign_keys.sql`

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
