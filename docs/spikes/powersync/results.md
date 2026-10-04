# PowerSync spike results

## Environment

- PowerSync Node SDK: `1.0.1`
- Local SQLite driver: `better-sqlite3 12.11.1`
- Integration boundary: Electron main process only
- Local database: separate from `studyplan.db`

## Result table

| Check                          | Status | Evidence                                                       |
| ------------------------------ | ------ | -------------------------------------------------------------- |
| Native SQLite loads in Node    | Passed | `better-sqlite3` in-memory query returned `{ ok: 1 }`          |
| Offline write survives restart | Passed | Electron check retained the same task ID                       |
| Upload queue survives restart  | Passed | Queue count remained 1 before and after restart                |
| Client schema v1 to v2         | Passed | Existing row read as `priority = null`, then updated to `high` |
| Typecheck                      | Passed | `npm run typecheck`                                            |
| Production bundle              | Passed | `electron-vite build` during `npm run powersync:test`          |
| Unpacked Electron package      | Passed | Packaged EXE returned a passing JSON report                    |
| Two-device cloud convergence   | Passed | Alice B received Alice A's uploaded row and `priority = high`  |
| Cross-user isolation           | Passed | Bob received zero rows; forbidden insert/update had no effect  |

## Findings

The installed Node SDK uses worker threads and a native SQLite driver. PowerSync owns the physical
client database and exposes the client schema through views. The existing Drizzle migrations remain
appropriate for `studyplan.db`; the spike therefore uses a separate database rather than replacing
the current migration path.

The online connector uses an ordinary Supabase user session and the public anon key. It never uses
or accepts the Supabase service-role key. Server-side row-level security is responsible for write
authorization.

The disposable cloud run drained Alice A's queue from one mutation to zero, replicated the row to
Alice B, returned no Alice rows to Bob, rejected Bob's forged insert and affected zero rows for
Bob's forged update. The temporary cloud row was deleted after the test.

The native module is rebuilt for the Electron ABI by `electron-builder install-app-deps`. A test
run through the system Node executable then fails with an ABI mismatch by design, so the automated
checks execute as a headless mode of the compiled Electron main process. This directly exercises
the target runtime and keeps the renderer out of the trust boundary.

The PowerSync default worker resolves its SQLite extension relative to JavaScript inside
`app.asar`, which Windows cannot load as a native DLL. The spike therefore supplies a small custom
worker and resolves the extension from `app.asar.unpacked`. Both `@powersync/node` and
`better-sqlite3` are explicitly unpacked by `electron-builder.yml`. The packaged executable was
run with `--powersync-spike-test` and passed all three automated checks.

## Repository baseline observations

- The repository-wide `npm run lint` currently reports pre-existing line-ending/Prettier findings
  across the project. The targeted PowerSync files pass ESLint.
- `npm run build:unpack` stops at the pre-existing `api:check` because generated API files in the
  clean worktree are considered stale. Running the same production bundle and packaging stages
  directly (`electron-vite build` and `electron-builder --dir`) succeeds.
- `npm audit` reports eight findings in the complete dependency graph (four moderate, three high,
  one critical). No automatic dependency upgrades were applied as part of this bounded spike.
