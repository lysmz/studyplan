# Decision

## Recommendation

**Go for one bounded production-like aggregate; do not migrate the complete application yet.**
Local durability, typed Drizzle access, packaged Electron execution, cloud convergence and
cross-user isolation all passed. The wrapper answers the original concern: adopting PowerSync does
**not** require discarding Drizzle's typed repository layer.

## Architectural rule

- Existing local-only tables: Drizzle schema and Drizzle Kit migrations remain unchanged.
- Synchronized client tables: PowerSync owns local SQLite creation; Drizzle defines typed access.
- Server tables: versioned PostgreSQL SQL migrations define constraints, indexes, grants and RLS.
- Sync exposure: versioned PowerSync sync-stream configuration selects the per-user rows and columns.

## Migration implication

Do not convert the current `events` table in place during the bachelor-project spike. Treat ID and
ownership conversion as a separate migration pattern: introduce a sync-ready UUID aggregate, migrate
or dual-write in a controlled release, verify convergence, and only then retire the integer-keyed
table. This is a useful reusable finding for the migration guide itself.

## Follow-up before a real feature rollout

1. Select one genuinely collaborative aggregate instead of converting all StudyPlan data.
2. Specify the integer-ID/user-ID to UUID ownership migration or dual-write phase.
3. Define conflict semantics and user-visible sync/error states for that aggregate.
4. Repeat the packaged test with the production update and release process.
