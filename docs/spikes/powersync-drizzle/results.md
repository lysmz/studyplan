# PowerSync + Drizzle wrapper results

## Automated local evidence

| Check                      | Status | Evidence                                                                                |
| -------------------------- | ------ | --------------------------------------------------------------------------------------- |
| Existing schema assessment | Passed | Existing `events.id` and `events.user_id` are numeric and require a migration boundary  |
| Drizzle schema conversion  | Passed | `DrizzleAppSchema` created the PowerSync schema for `spike_events`                      |
| Typed CRUD and filtering   | Passed | Insert, batch insert, select filters, update and delete used Drizzle APIs               |
| Domain mapping             | Passed | ISO timestamps returned as `Date`; integer-backed boolean returned as boolean           |
| Offline restart            | Passed | Event and four queued mutations survived database close/reopen                          |
| Electron production bundle | Passed | `npm run powersync:drizzle:test` built and ran headlessly                               |
| Cloud convergence          | Passed | Alice B received Alice A's typed event; upload queue changed from 1 to 0                |
| Cross-user RLS             | Passed | Bob saw zero Alice rows; foreign-owner insert was rejected and update changed zero rows |
| Unpacked package           | Passed | Packaged `studyplan.exe` emitted `"result": "pass"` for all local checks                |

## Findings

The Drizzle wrapper is useful, but it does not make Drizzle the owner of the local database schema.
PowerSync still owns the physical SQLite database and derives its client views from the schema given
to the SDK. Drizzle remains the typed schema/query/repository layer. PostgreSQL evolution is handled
by reviewed server migrations, while a compatible PowerSync schema and sync stream are deployed with
the application change.

The current `events` aggregate cannot be synchronized unchanged. It uses an autoincrement integer ID
and a local integer user ID, while PowerSync requires a single text `id` and Supabase ownership uses
the authenticated user's UUID. The spike therefore uses a separate table with client-generated UUIDs
and `owner_id` UUIDs. This makes the incompatibility measurable without forcing a production data
migration into the feasibility study.

SQLite stores the Drizzle boolean as `0`/`1`, whereas the PostgreSQL API expects JSON booleans. The
upload connector explicitly converts `is_multi_day` before sending a mutation. ISO-8601 timestamp
strings need no equivalent conversion and retain deterministic ordering in SQLite.

Drizzle Kit migrations remain valuable for the existing local-only `studyplan.db`. They are not
executed against a PowerSync-owned client database. If StudyPlan adopts PowerSync, synchronized tables
need a server-first migration path plus a coordinated client-schema rollout.

## Cloud evidence

The final cloud run used three fresh local replicas: Alice device A, Alice device B and Bob. Alice A
created a typed event through the Drizzle repository. Its upload queue contained one mutation and
then drained to zero. Alice B received the same UUID, title and `2026-11-03T09:00:00.000Z` start
date. Bob received no Alice rows. Supabase RLS rejected Bob's attempt to insert a row owned by Alice,
and Bob's attempted update of Alice's event affected zero rows. The event was deleted through the
typed repository and the cleanup mutation also drained to zero.

An initial run exposed an operationally relevant failure mode: the repository contained the new
`spike_events` Sync Stream, but the active PowerSync deployment still advertised only
`spike_tasks`. The client remained connected and healthy while never receiving the new aggregate.
After deploying Sync Streams v3, the unchanged client test passed. The harness now reports active
stream names and per-client sync state when convergence times out.

The harness accepts the current Supabase `SUPABASE_PUBLISHABLE_KEY` variable while retaining the
legacy `SUPABASE_ANON_KEY` fallback. No service-role credential is required or accepted.
