# PowerSync + Drizzle wrapper spike

## Decision question

Can StudyPlan keep Drizzle as its typed query and repository layer while PowerSync owns the
offline SQLite database and synchronization lifecycle?

## Timebox and boundary

One working day. The spike implements one representative `spike_events` aggregate in a separate
PowerSync database. It does not migrate the production `events` table, change the renderer API, or
implement general account management and collaboration.

## Hypothesis

`@powersync/drizzle-driver` can preserve the useful part of Drizzle—typed schemas, queries, filters,
inserts, updates and repository tests—without using Drizzle migrations against the PowerSync-owned
client database. PostgreSQL migrations and PowerSync sync-stream definitions remain explicit server
artifacts.

## Required checks

1. Convert a Drizzle table definition into a PowerSync client schema.
2. Run typed event CRUD and filtering through `wrapPowerSyncWithDrizzle`.
3. Preserve client-generated UUIDs, booleans and ISO timestamps across restart and sync.
4. Prove two-device convergence for Alice and isolation from Bob.
5. Load the wrapper and native SQLite code from an unpacked production package.
6. Document incompatibilities between the existing `events` table and a sync-ready aggregate.

## Hard stop criteria

- The wrapper cannot run with `@powersync/node` in the Electron main process.
- It requires schema-changing SQL to run against the PowerSync client database.
- Common repository operations need raw SQL or untyped casts.
- PostgreSQL RLS cannot prevent cross-user reads and writes.
- Packaging requires renderer-side Node access or secrets.

## Explicit non-goals

- Replacing all existing Drizzle repositories.
- Migrating existing integer IDs to UUIDs in production.
- Conflict-resolution UX or shared-group authorization.
- Selecting the final production backend solely from this spike.
