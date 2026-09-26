# StudyPlan architecture

These diagrams describe the normal desktop app startup and the features wired into its UI. The
`src/main/spikes` runners are invoked only by test flags (or the explicit
`POWERSYNC_SPIKE_ENABLED` setting) and are outside the main application path.

For a file-by-file explanation of the synchronized groups feature, see the
[sync collaboration guide](sync-collaboration-guide.md).

## Component diagram

```mermaid
flowchart LR
  subgraph Desktop["Electron desktop application"]
    subgraph Renderer["Renderer process"]
      Pages["React pages and Wouter routes"]
      Queries["TanStack Query and generated API hooks"]
      SyncClient["Collaboration client"]
    end

    subgraph Preload["Sandboxed preload"]
      ApiBridge["apiTransport bridge"]
      SyncBridge["collaborationTransport bridge"]
    end

    subgraph Main["Electron main process"]
      ApiDispatcher["OpenAPI IPC dispatcher<br/>sender and Zod validation"]
      ApiHandlers["Auth and domain handlers"]
      Services["Domain services and session"]
      Repositories["Drizzle repositories"]
      FilePickers["Native CSV and iCalendar pickers"]
      SyncIpc["Collaboration IPC<br/>sender, input, and local session checks"]
      SyncRuntime["Collaboration runtime<br/>remote session and membership checks"]
      SyncRepos["PowerSync Drizzle repositories"]
      OnlineGateway["Online group and invitation gateway"]
      Connector["PowerSync connector<br/>credentials and task upload"]
    end

    AppDb[("Local SQLite via libSQL<br/>users, personal data, local groups")]
    SyncDb[("PowerSync SQLite per Supabase user<br/>synced groups, invitations, tasks")]
  end

  subgraph Cloud["Cloud services for Gruppen (Sync)"]
    SupaAuth["Supabase Auth"]
    SupaDb[("Supabase Postgres<br/>RPCs and RLS")]
    PowerSync["PowerSync service<br/>user-scoped sync streams"]
  end

  Pages --> Queries --> ApiBridge --> ApiDispatcher --> ApiHandlers --> Services --> Repositories --> AppDb
  ApiHandlers --> FilePickers
  Pages --> SyncClient --> SyncBridge --> SyncIpc --> SyncRuntime
  SyncRuntime --> SyncRepos --> SyncDb
  SyncRuntime --> OnlineGateway --> SupaDb
  SyncRuntime --> Connector
  Connector --> SupaAuth
  Connector --> SupaDb
  Connector <--> PowerSync
  PowerSync <--> SyncDb
  SupaDb --> PowerSync
```

The two SQLite files have different purposes. The main database is initialized and migrated before
the window opens. It stores local accounts, events, grades, timetable entries, study programs, and
the original local group feature. The separate PowerSync database is opened after a Supabase sign-in
and is named for that remote user. It holds the five synchronized tables: `profiles`,
`study_groups`, `group_members`, `group_invitations`, and `group_tasks`. The original local groups
are not synchronized or migrated into those tables.

`api/openapi.yaml` generates the shared API contract and renderer hooks used by the local path.
The collaboration path uses its own typed IPC contract. Both cross the isolated preload bridge;
neither renderer path accesses Node or either database directly.

## Request and data flow

```mermaid
flowchart TD
  User["User acts in a React page"] --> Feature{"Feature path"}

  Feature -- "Personal data or local groups" --> LocalHook["Generated query or mutation hook"]
  LocalHook --> LocalIpc["Preload API bridge"]
  LocalIpc --> LocalGuard["Main IPC: allowed sender and contract input; local session for protected operations"]
  LocalGuard --> LocalService["Domain handler and service"]
  LocalService --> LocalWrite["Drizzle repository reads or writes main SQLite"]
  LocalWrite --> LocalResult["Validated IPC result returns to UI"]

  Feature -- "Gruppen (Sync)" --> SyncCall["Collaboration client and preload bridge"]
  SyncCall --> SyncGuard["Main IPC: allowed sender, input, local account"]
  SyncGuard --> SyncOperation{"Collaboration operation"}
  SyncOperation -- "Sign in" --> SignIn["Authenticate with Supabase; open per-user PowerSync DB"]
  SignIn --> SyncResult
  SyncOperation -- "Data operation" --> RemoteSession{"Supabase session active?"}
  RemoteSession -- "No" --> AuthError["Return UNAUTHENTICATED error"]
  RemoteSession -- "Yes" --> Action{"Data operation"}

  Action -- "Read groups, invitations, or tasks" --> SyncRead["Read local PowerSync SQLite"]
  SyncRead --> SyncResult["Return local result to UI"]

  Action -- "Create, edit, or delete task" --> Membership["Check cached group membership; validate assignee when set"]
  Membership --> SyncWrite["Write task to local PowerSync SQLite"]
  SyncWrite --> SyncResult
  SyncWrite --> Queue["PowerSync queues the change"]
  Queue --> Upload["Connector uploads task to Supabase Postgres when connected"]

  Action -- "Create group or manage invitation" --> Online{"Online?"}
  Online -- "No" --> OfflineError["Return OFFLINE error"]
  Online -- "Yes" --> Rpc["Call authenticated Supabase RPC"]
  Rpc --> RemoteDb[("Supabase Postgres")]
  Upload --> RemoteDb
  RemoteDb --> Streams["PowerSync user-scoped streams"]
  Streams --> SyncCache["Refresh local PowerSync SQLite"]
  SyncCache --> SyncRead
```

Task writes return after the local PowerSync write; upload and delivery to other members occur
later when connected. Group creation, profile search, invitation sending, and invitation responses
require an online RPC. The PowerSync streams filter group data by membership and invitation data by
participant. Supabase RLS protects the remote tables and task upload. The local StudyPlan account
must be signed in before any collaboration IPC operation; Supabase sign-in is an additional session.
The Supabase session is kept in memory, so the user signs in again after an app restart.

## Code map

| Area                                            | Source                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Startup, process boundaries, handler wiring     | `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/src/App.tsx`                                 |
| Generated local API and validation              | `api/openapi.yaml`, `src/main/ipc/api-dispatcher.ts`, `src/renderer/src/api/generated/`                 |
| Local session, services, repositories, database | `src/main/auth/`, `src/main/services/`, `src/main/repositories/`, `src/main/db/`                        |
| Collaboration IPC and runtime                   | `src/shared/collaboration/ipc.ts`, `src/main/collaboration/ipc.ts`, `src/main/collaboration/runtime.ts` |
| PowerSync storage and upload                    | `src/main/collaboration/database.ts`, `repositories.ts`, `connector.ts`                                 |
| Online RPCs and stream rules                    | `src/main/collaboration/online-gateway.ts`, `spike/powersync-groups/sync-streams-v4.yaml`               |
