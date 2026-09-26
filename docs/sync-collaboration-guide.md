# How synchronized groups work

This guide follows the `/gruppen-sync` feature as implemented in this repository. For a picture of
the whole app, see the [component and flow diagrams](architecture.md).

## The short mental model

There are two accounts and two local databases:

1. A **StudyPlan account** lives in the main SQLite database. Its numeric user ID and in-memory
   session control access to the desktop app.
2. A **Supabase account** has a UUID. Signing in to it opens a separate, persistent PowerSync SQLite
   file at `userData/collaboration/collaboration-<supabase-user-id>.db`.

The existing `/gruppen` feature uses the first database. `/gruppen-sync` uses the second. Their group
records and IDs are separate. Only five tables participate in sync: `profiles`, `study_groups`,
`group_members`, `group_invitations`, and `group_tasks`. Events, notes, comments, and the original
local group data are outside this sync feature.

The Supabase session stays in main-process memory (`persistSession: false`). The PowerSync file and
pending task writes survive a restart, but the user must sign in to Supabase again before the app
reopens and connects that file.

## File map

| Layer               | Files                                                                                                                                                                                                                                                                                                                                                                                                | Responsibility                                                                                                  |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Supabase schema     | [`0004_create_collaboration_groups.sql`](../spike/powersync-groups/supabase/migrations/0004_create_collaboration_groups.sql), [`0005_allow_rls_membership_helpers.sql`](../spike/powersync-groups/supabase/migrations/0005_allow_rls_membership_helpers.sql), [`0006_index_collaboration_foreign_keys.sql`](../spike/powersync-groups/supabase/migrations/0006_index_collaboration_foreign_keys.sql) | Remote tables, constraints, triggers, RLS, RPCs, grants, replication publication, and follow-up grants/indexes. |
| PowerSync rules     | [`sync-streams-v4.yaml`](../spike/powersync-groups/sync-streams-v4.yaml)                                                                                                                                                                                                                                                                                                                             | Selects which group, task, invitation, and profile rows each signed-in user downloads.                          |
| Shared IPC types    | [`src/shared/collaboration/ipc.ts`](../src/shared/collaboration/ipc.ts)                                                                                                                                                                                                                                                                                                                              | Operation names, inputs, outputs, state, and error types.                                                       |
| Renderer            | [`gruppen-sync.tsx`](../src/renderer/src/pages/gruppen-sync.tsx), [`client.ts`](../src/renderer/src/collaboration/client.ts)                                                                                                                                                                                                                                                                         | Screens, React Query queries/mutations, polling, cache invalidation, and typed IPC calls.                       |
| Electron boundary   | [`src/preload/index.ts`](../src/preload/index.ts), [`src/main/collaboration/ipc.ts`](../src/main/collaboration/ipc.ts)                                                                                                                                                                                                                                                                               | Exposes one narrow renderer transport; checks sender, input, and local StudyPlan session in main.               |
| Orchestration       | [`runtime.ts`](../src/main/collaboration/runtime.ts)                                                                                                                                                                                                                                                                                                                                                 | Holds the active Supabase user, opens/closes their database, checks membership, and routes operations.          |
| Local sync store    | [`schema.ts`](../src/main/collaboration/schema.ts), [`database.ts`](../src/main/collaboration/database.ts), [`repositories.ts`](../src/main/collaboration/repositories.ts)                                                                                                                                                                                                                           | Defines the five local tables, opens PowerSync with a Drizzle wrapper, and performs local reads/task writes.    |
| Cloud calls         | [`connector.ts`](../src/main/collaboration/connector.ts), [`online-gateway.ts`](../src/main/collaboration/online-gateway.ts)                                                                                                                                                                                                                                                                         | Authenticates PowerSync and uploads queued tasks; calls online-only Supabase RPCs.                              |
| Startup and support | [`src/main/index.ts`](../src/main/index.ts), [`src/main/spikes/powersync/database.ts`](../src/main/spikes/powersync/database.ts), [`powersync.worker.ts`](../src/main/spikes/powersync/powersync.worker.ts), [`.env.powersync-groups.example`](../.env.powersync-groups.example)                                                                                                                     | Wires the runtime and IPC, loads configuration, and provides the worker-backed PowerSync SQLite implementation. |
| Checks              | [`electron-smoke.ts`](../src/main/collaboration/electron-smoke.ts), [`cloud-smoke.ts`](../src/main/collaboration/cloud-smoke.ts)                                                                                                                                                                                                                                                                     | Local offline persistence and two-user cloud flow checks.                                                       |

`src/main/collaboration/index.ts` re-exports the collaboration modules. The UI routes are registered
in `src/renderer/src/App.tsx`; `src/renderer/src/components/layout.tsx` puts them in the sidebar.

## 1. Supabase migration: remote source of truth

The first migration creates five `public` tables:

| Table               | Meaning                                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `profiles`          | Public-safe name/display information linked one-to-one to `auth.users`; an Auth trigger creates a profile for new users and the migration backfills existing users. |
| `study_groups`      | Group name, description, creator, and timestamps.                                                                                                                   |
| `group_members`     | User-to-group relation with `owner` or `member` role; a unique index permits only one owner per group.                                                              |
| `group_invitations` | Inviter, invitee, pending/accepted/declined status; a partial unique index prevents duplicate pending invitations.                                                  |
| `group_tasks`       | Shared task fields, assignee, status, creator/editor, and timestamps. This is the only table the sync connector uploads.                                            |

Constraints reject invalid names, task status, invitation state, and duplicate membership. Triggers
maintain `updated_at` and prevent changes to profile/task identity fields. Row level security (RLS)
allows members to read their groups and tasks, invitation participants to read their invitations,
and members to write tasks. Task insert/update policies also require the assignee to belong to the
group. The client additionally checks membership using the local cache before writing, but the
remote RLS policy is the authority when upload reaches Supabase.

Four authenticated RPC functions perform changes that need server-side checks or an atomic
transaction:

| RPC                         | What it does                                                                                                                    |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `create_group_with_owner`   | Creates the group and its owner membership together.                                                                            |
| `search_invitable_profiles` | Lets an owner find discoverable non-members who do not already have a pending invitation; returns only ID and safe name fields. |
| `send_group_invitation`     | Requires the caller to be the owner and creates a pending invitation.                                                           |
| `respond_group_invitation`  | Requires the caller to be the invitee; on acceptance, adds membership and marks the invitation answered.                        |

These RPCs are `SECURITY DEFINER`, so each checks `auth.uid()` and its own authorization conditions.
The migration grants their execution to authenticated users. The second migration grants access to
the private membership helper functions needed by RLS policy evaluation; it does not expose the
private schema through the Supabase Data API. The third migration adds indexes for remaining user
foreign keys. The first migration also grants `powersync_role` read access and adds the five tables
to the `powersync` publication.

## 2. PowerSync: who receives which rows

[`sync-streams-v4.yaml`](../spike/powersync-groups/sync-streams-v4.yaml) has two automatically
subscribed streams. `collaboration_groups` first finds the signed-in user's group IDs from
`group_members`, then downloads those groups, memberships, tasks, and member profiles.
`collaboration_invitations` downloads invitations involving the user and the relevant inviter or
invitee profiles. Someone invited to a group does not get its group/task graph until they accept and
become a member.

This stream configuration is the download filter for PowerSync. Supabase RLS governs direct
authenticated database/API access and task uploads; it is not a substitute for the PowerSync
stream filters, because PowerSync reads the publication through its replication role.

## 3. Opening the local sync database and signing in

At normal app startup, [`src/main/index.ts`](../src/main/index.ts) loads
`.env.powersync-groups.local`, constructs `CollaborationRuntime`, and registers its IPC handler. The
example file lists the required PowerSync endpoint, Supabase URL, and publishable key. The runtime
reports `configured: false` if any is missing; the renderer shows a configuration message.

When the user submits the sync sign-in form:

1. `CollaborationRuntime.signIn()` calls `SupabaseCollaborationConnector.signIn()`. The connector
   creates a Supabase client, signs in with email/password, and resolves the Auth user UUID.
2. The runtime opens `collaboration-<uuid>.db`. `database.ts` delegates to the worker-backed
   `openPowerSyncSpikeDatabase()` helper, passing the five-table schema, then wraps the database in
   Drizzle. The helper's historical `spikes` path is still used by the active feature.
3. The runtime calls `powerSync.connect(connector)` and keeps the Supabase client, connector,
   gateway, database, and repositories in one active session object.

The connector's `fetchCredentials()` gives PowerSync its endpoint and the current Supabase access
token. `state().connected` reads PowerSync's current connection status. On sign-out, the runtime
closes the PowerSync database and locally signs out of Supabase.

## 4. The connector's upload logic

[`connector.ts`](../src/main/collaboration/connector.ts) implements the PowerSync backend connector.
Its `uploadData(database)` method:

1. Requests up to 100 pending local CRUD entries with `getCrudBatch(100)`.
2. Rejects a queued write unless its table is `group_tasks`. This feature reads the other four
   tables from sync downloads and uses RPCs for group/invitation changes. The SQL permits a user to
   update their own profile, but this renderer and connector do not implement profile editing.
3. Converts PowerSync `PUT`, `PATCH`, and `DELETE` into Supabase `upsert`, `update`, and `delete`
   calls on `group_tasks`, respectively.
4. Throws if Supabase rejects any entry. Only after every entry in the batch succeeds does it call
   `batch.complete()` to acknowledge the batch.

The queue is stored in the PowerSync SQLite file. A task can therefore be written while disconnected,
shown in the UI immediately, and uploaded after reconnecting. A successful local mutation means
**saved locally**, not yet delivered to Supabase or other members. The cloud check verifies that an
offline task remains queued and later appears in a second user's local database.

## 5. Which operations use local data and which use RPCs

| User action                                                 | Main-process route                                                                                          | Network requirement                                              |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| List groups, members, pending invitations, or tasks         | `CollaborationRuntime` → Drizzle repositories → PowerSync SQLite                                            | Can read cached rows offline after sign-in.                      |
| Create, edit, or delete a task                              | Runtime membership checks → `CollaborationTasksRepository` → local PowerSync write → connector upload later | Local write works offline; remote delivery waits for connection. |
| Create a group, search people, send or answer an invitation | Runtime → `SupabaseCollaborationGateway` → authenticated RPC → Supabase Postgres                            | Requires an online connection.                                   |

For group creation or invitation acceptance, the RPC returns before PowerSync necessarily downloads
the new group graph. The UI can temporarily show that the group is still synchronizing. The
repositories read only the local PowerSync database; they do not fall back to a direct remote read.

## 6. Electron IPC and local account boundary

The renderer calls the typed `collaboration()` wrapper in
[`src/renderer/src/collaboration/client.ts`](../src/renderer/src/collaboration/client.ts). It invokes
`window.collaborationTransport`, which the sandboxed preload exposes using `contextBridge`. The
preload uses the dedicated `collaboration:invoke` channel.

[`src/main/collaboration/ipc.ts`](../src/main/collaboration/ipc.ts) checks that the caller is an
allowed app window, validates the operation input with Zod, and requires a signed-in **local**
StudyPlan user. It binds the active Supabase session to that local user ID; if the local user changes
or signs out, it closes the collaboration session. It routes each operation to the runtime and
returns typed success/error envelopes (`INVALID`, `UNAUTHENTICATED`, `OFFLINE`, `FORBIDDEN`, or
`FAILED`). This is a separate contract from the generated OpenAPI IPC used by the rest of the app.
The collaboration input is runtime-validated here; the output type is a TypeScript contract, rather
than a Zod output validation step.

## 7. Renderer hooks and refresh behavior

All sync screen hooks currently live in
[`src/renderer/src/pages/gruppen-sync.tsx`](../src/renderer/src/pages/gruppen-sync.tsx). They are
ordinary TanStack React Query hooks around `collaboration()`; there is no PowerSync SDK instance or
direct Supabase client in the renderer.

- `useCollaborationState()` calls `state` every **2 seconds** to show configuration, sign-in, and
  connection status.
- The overview queries `listGroups` and `listInvitations` every **2 seconds** after Supabase sign-in.
  Sign-in invalidates the `['collaboration']` query family. Group creation and invitation responses
  invalidate the relevant list queries.
- The detail screen queries `getGroup`, `listMembers`, and `listTasks` every **2 seconds**. Member
  and task queries wait until the group query succeeds. The candidate search runs only when the
  group owner has entered at least two characters; that search calls the online RPC.
- Mutations call `createGroup`, `sendInvitation`, `respondInvitation`, and task CRUD. A successful
  task mutation invalidates `['collaboration', 'tasks', groupId]` so the next read picks up the local
  write immediately. Task creation shows the toast “Aufgabe lokal gespeichert” (“Task saved
  locally”), which accurately describes that stage of sync.
- Switching online accounts removes collaboration queries from the cache. Logging out of the local
  StudyPlan account in `components/layout.tsx` also signs out the collaboration session and clears
  the React Query cache.

The renderer learns about PowerSync downloads by polling those IPC-backed local queries. It does
not subscribe to PowerSync table changes directly. The UI currently displays a connected/offline
indicator; it does not show a separate per-task upload acknowledgement.

## Two concrete journeys

**An offline task:** The detail page calls `createTask` → preload IPC → main IPC validation →
runtime checks cached membership/assignee → repository inserts into the local PowerSync table →
renderer invalidates its task query and shows the new row. PowerSync queues the write. When it
reconnects, `uploadData()` sends it to Supabase, where task RLS checks it. PowerSync's publication
and streams then deliver the row to other members' local databases; their screens see it on a later
poll.

**An accepted invitation:** The overview calls `respondInvitation` → preload IPC → runtime →
online gateway → `respond_group_invitation` RPC. The RPC checks that the caller is the invitee,
creates membership, and updates the invitation. The new membership changes the user's PowerSync
stream: the group, members, profiles, and tasks download to their local database. The overview
invalidates its group/invitation queries and then sees the group on a later poll.
