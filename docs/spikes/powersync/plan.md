# PowerSync feasibility spike

## Decision question

Can StudyPlan run PowerSync in the hardened Electron main process while retaining offline
durability, bounded repository integration, controlled schema evolution, and server-enforced
user isolation?

## Timebox

One working day. The spike must not migrate production StudyPlan data or broaden into a full
authentication or collaboration implementation.

## Scope

The spike owns one isolated `spike_tasks` aggregate. It uses client-generated UUIDs and a
separate `powersync-spike-<device>.db` file. Existing StudyPlan tables, migrations, and
repositories remain untouched.

## Required checks

1. Node SDK opens from the Electron main process.
2. Development and unpacked production builds load the native SQLite module.
3. Offline writes and the upload queue survive a process restart.
4. Two device databases for the same account converge through PowerSync.
5. A second account cannot read or mutate the first account's rows.
6. An additive `priority` column can be rolled out from schema v1 to schema v2 without losing
   existing rows.

## Hard stop criteria

- Main-process or packaged execution is unreliable.
- The integration requires Node access or credentials in the renderer.
- Offline data or queued mutations are lost on restart.
- Supabase row-level security does not isolate users.
- The single-table integration forces broad changes to existing StudyPlan features.

## Decision scoring

| Criterion                            | Weight |
| ------------------------------------ | -----: |
| Electron and packaging compatibility |    30% |
| Offline persistence and convergence  |    25% |
| Integration effort                   |    20% |
| Schema evolution                     |    15% |
| Security boundary                    |    10% |

A Go requires at least 70/100 and no hard-stop failure.
