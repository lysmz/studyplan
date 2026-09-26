# Test-led plan: collaboration upload correctness

## Status and baseline

- Status: implemented and verified on 2026-09-26. See [results and limitations](p1-hardening-results.md).
- Prepared: 2026-09-26.
- Reviewed feature commit: `e5d54e0`.
- Checkout when planning: `e2a35db`; the collaboration connector remains unchanged.
- Existing evidence: local task durability and the two-user cloud happy path, described in
  [implementation.md](implementation.md).

The objective is to make queued task writes observable, recoverable, and safe to retry. Each P1
must have a failing regression test before its fix, followed by verification with the real queue.
Passing typecheck or the existing happy-path test alone does not close a P1.

## Work items and completion evidence

| Item                    | Failure to reproduce                                                                                   | Evidence required to close it                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| P1-1: zero-row update   | A PATCH affects no server row, but its queue entry is treated as accepted                              | Missing or inaccessible task updates become durable, visible failures; the intended edit is preserved              |
| P1-2: blocked queue     | A permanent rejection causes the oldest batch to retry indefinitely                                    | The failed intent survives restart, unrelated valid writes upload, and transient errors retain their queue entries |
| P1-3: replay overwrites | An earlier successful write is replayed after a later batch failure and overwrites another user's edit | Repeating an accepted operation cannot change the server row again, including after an ambiguous network response  |

Keep PowerSync, Drizzle, Supabase, the five synchronized domain tables, and the online-only
membership/invitation operations. Scope includes the minimal persistent failure reporting needed
to make rejected uploads visible. The OpenAPI consolidation, general session refactor, polling
replacement, and other P2/P3 cleanup remain separate follow-up work.

## 1. Define the observable behavior before changing the connector

Use these acceptance rules in tests:

1. A local save means the intent is durably stored locally. Server acceptance is a separate outcome.
2. An upload is accepted only after the backend confirms application or identifies an earlier
   successful application of the same logical operation.
3. A PATCH with zero affected rows is an unresolved missing-or-inaccessible target. Preserve the
   edit and report rejection; do not infer which permission or existence condition caused it.
4. A DELETE of an already absent task may be accepted as an idempotent no-op. This does not prove
   that the caller has access to the group and must not reveal hidden rows.
5. A confirmed permanent rejection is stored in a durable local failure record before retiring
   its queue entry. A toast or a console log is insufficient.
6. Network failures, timeouts, server failures, expired authentication, and unknown error categories
   remain retryable or pending authentication. They must not be discarded as permanent failures.
7. Valid later operations on unrelated tasks can proceed after a permanent rejection is recorded.
   Later operations on the rejected task need an explicit dependency policy; they cannot disappear
   as apparently successful zero-row updates.
8. A replay of an accepted PUT, PATCH, or DELETE does not apply that operation a second time.
9. For distinct accepted PATCH operations, use server acceptance order on changed fields as the
   prototype conflict policy. A late PATCH after deletion is rejected and preserved. This is not
   collaborative text merging or a claim that concurrent edits cannot conflict.

Choose these rules explicitly in the implementation decision record. Any change to them requires
updating the scenario and its assertion, with a documented reason.

## 2. Build a small test harness

### Fast behavior and transport tests

Proposed files: `scripts/collaboration/upload.test.ts` and
`scripts/collaboration/helpers/scripted-backend.ts`.

- Use the existing `node:test`, `node:assert/strict`, and `tsx` conventions.
- Add a proposed `collaboration:test` npm command; it must run without Electron or cloud credentials.
- Introduce only the small seams needed to inject backend outcomes, queue acknowledgement, and
  failure storage. Keep upload policy testable without importing Electron or native SQLite.
- Test the current connector first through a controlled queue and backend. Minimal seam extraction
  must preserve its behavior, so the three reproduction tests fail for the original reasons.
- For Supabase transport checks, use the real Supabase client with an injected `fetch` that returns
  scripted HTTP responses. Avoid mocking the fluent query builder's implementation details.
- Model server rows and another actor's edits in the scripted backend. Assert final data and durable
  outcomes, rather than only method calls or exact SQL strings.
- Trigger failures at explicit boundaries: before request, after server commit but before response,
  during failure-record persistence, and during queue acknowledgement. Use barriers rather than
  timing-dependent sleeps. Use synthetic tokens and profiles only.

These tests validate policy and transport interpretation. They cannot prove actual RLS behavior,
PowerSync queue semantics, or replica convergence.

### Real local queue tests

Extend `src/main/collaboration/electron-smoke.ts`, or add a sibling harness using the same Electron
entry point. Use temporary databases, real Drizzle task operations, and the installed PowerSync SDK;
inject only the backend transport and deliberate failures.

- Generate PUT/PATCH/DELETE entries through repository writes rather than inventing their shape.
- Seed server-managed rows as the existing local harness does, then acknowledge the fixture-only
  entries before connecting the task uploader. Assert that fixtures do not contaminate task counts.
- Inspect real queue contents and counts, including multiple operations in one local transaction.
- Reopen the actual database to verify restart durability; include one controlled process-exit
  case at the journal-before-ack boundary to verify recovery beyond orderly close.
- Use public SDK queue APIs. Do not edit `ps_crud` or other PowerSync internals.
- Verify that storing failure records produces no synchronized CRUD entries.

### Backend and two-user integration tests

Extend `src/main/collaboration/cloud-smoke.ts` for the small cloud verification below. Use real
authenticated Alice/Bob clients and a test-only transport wrapper for deterministic lost responses.
If a new upload RPC is selected, add local Postgres security/transaction tests using the actual
migrations. A mocked backend does not close an authorization or transaction requirement.

## 3. Test matrix

### P1-1: acknowledgement and zero-row results

| ID  | Arrange and act                                       | Required assertion                                                                                                 | Layers                  |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------- |
| Z1  | Queue a PATCH; backend returns success with zero rows | Not recorded as accepted; intended changed fields are retained in a durable failure record before queue retirement | Fast, real queue, cloud |
| Z2  | Queue a PATCH for a task hidden by RLS                | Same missing-or-inaccessible outcome; no hidden task data or existence claim is returned                           | Backend, cloud          |
| Z3  | PATCH an accessible existing task                     | Changed fields reach the server and another replica; failure count stays zero                                      | Fast, cloud             |
| Z4  | DELETE an already absent task                         | Safe idempotent outcome; no recurring failure loop                                                                 | Fast, cloud             |

Z1 must fail against the current connector. Distinguish an empty result from a malformed or
unexpected response: an unrecognized response remains pending, rather than being silently accepted.

### P1-2: durable rejection and continued progress

| ID  | Arrange and act                                                           | Required assertion                                                                                    | Layers                  |
| --- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------- |
| Q1  | Queue invalid task A, then valid unrelated task B; reject A permanently   | A has one durable failure record; B uploads; normal queue drains without losing A's intent            | Fast, real queue, cloud |
| Q2  | Fail upload transiently before server application, then restore transport | Original intent remains queued during failure and uploads after recovery; no permanent failure record | Fast, real queue        |
| Q3  | Return expired-auth and unknown-error responses                           | Pending entries remain; authentication is distinguished from confirmed task rejection                 | Fast                    |
| Q4  | Failure store cannot persist A                                            | A is not acknowledged; retry after storage recovery preserves it exactly once                         | Fast, real queue        |
| Q5  | Persist A's failure, then fail acknowledgement or exit before it          | Restart reuses the same failure record, retires A safely, and uploads B                               | Fast, real queue        |
| Q6  | Reject a PUT followed by PATCH/DELETE entries for the same task           | Dependent intent is retained and explicitly classified; unrelated task B still progresses             | Fast, real queue        |
| Q7  | Open another user's database after a rejection                            | Failure records remain isolated to the original Supabase user                                         | Real queue              |
| Q8  | Insert a queued write to a server-managed table                           | No forbidden backend mutation; surfaced contract error with no silent acknowledgement                 | Fast                    |

Q1 must fail against the current connector. Select a narrow whitelist of permanent backend errors
from structured codes and validated authentication context. Do not classify every 4xx response, or
every thrown exception, as permanent.

### P1-3: retries and concurrent changes

| ID  | Arrange and act                                                                    | Required assertion                                                                     | Layers                  |
| --- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ----------------------- |
| R1  | Upload Alice's PUT A; fail a later entry; Bob changes A; replay Alice's queue      | Bob's newer values remain; replay does not overwrite any column of A                   | Fast, real queue, cloud |
| R2  | Commit Alice's PUT, drop its response; Bob edits it; Alice retries                 | Retry recognizes earlier acceptance and preserves Bob's edit                           | Fast, cloud             |
| R3  | Commit Alice's PATCH, drop its response; Bob changes the same field; Alice retries | Earlier PATCH is not applied again; Bob's value remains                                | Fast, cloud             |
| R4  | Commit DELETE, drop response, then retry                                           | No resurrection and no permanent retry loop                                            | Fast, cloud             |
| R5  | Use the same queue sequence on two replicas, then restart one replica              | Logical operation identities are distinct across replicas and stable across restart    | Fast, real queue        |
| R6  | Replay an operation ID with changed payload or a colliding task ID                 | Conflict is explicit; another task or user's receipt is not accepted as this operation | Fast, backend           |

R1 must fail against the current connector. R2/R3 are required: using smaller batches alone cannot
solve a successful request whose response is lost.

## 4. Implementation decisions driven by these tests

### A. Explicit outcomes and failure storage

Replace the implicit `error === null` success rule with accepted, already-applied, rejected, and
retry/pending-auth outcomes. Obtain actual affected-row information for PATCH or return a structured
outcome from the upload RPC. Preserve the original backend error code for classification.

Store rejected intent per Supabase user with task/group IDs, operation identity, operation kind,
changed fields, available desired local task snapshot, reason, and detection time. Persist the
snapshot before acknowledgement allows PowerSync to reconcile away the optimistic row. Logs and
reports should contain scenario IDs and counts, rather than raw task content or credentials.

Select a supported local-only table if compatible with the Drizzle wrapper; otherwise use a small
separate per-user local store. Prove journal writes do not enter the upload queue. Journal-before-ack
ordering must survive a crash and deduplicate records; do not assume the SDK acknowledgement and
the journal write share a transaction.

### B. Queue acknowledgement boundaries

Inspect the installed SDK's `getNextCrudTransaction()` and `complete()` semantics before choosing
the processing unit. Preserve ordering and local transaction boundaries. An SDK transaction may
contain multiple operations, so selecting that API does not itself make remote writes atomic.

Complete a processing unit only when every entry is accepted/already-applied or durably recorded as
rejected. A transient or ambiguous failure keeps its pending work. Already-applied operations in a
partly processed unit must be safe to repeat. Use Q4/Q5 and R1 to validate acknowledgement boundaries.

### C. Replay protection decision gate

Try the smallest design against R1-R3 before expanding backend infrastructure: create-only PUT
semantics, checked PATCH outcomes, and narrower acknowledgement boundaries. A duplicate PUT must
not overwrite an existing task; a matching task UUID alone is not proof of earlier acceptance.

If this cannot pass the lost-response and PATCH-replay tests, use a small authenticated task-upload
RPC with a private, unsynchronized operation-receipt table. Commit the task mutation and acceptance
receipt in the same Postgres transaction. Key operations by caller, persistent replica identity,
and persisted queue-operation identity; verify the mapping with R5. Replays return earlier acceptance
without changing the task. No receipt is written for an uncommitted mutation.

This is application upload idempotency around PowerSync's existing queue, not a replacement sync
engine. Record why receipts were necessary, their storage cost, and their retention policy. Do not
expire receipts while queued operations could still replay; premature expiry would invalidate R2/R3.

If the RPC is needed, require backend tests for:

- Anonymous and non-member mutations denied; owner/member task mutations allowed.
- Cross-user operation receipt access denied, without returning hidden task contents.
- Existing task identity and assignee-membership rules preserved.
- Concurrent requests with the same operation identity apply once.
- Changed payload under the same identity rejected.
- Task mutation and receipt both roll back on transaction failure.

Generate a new migration when implementing; preserve applied migrations `0004`-`0006`.

### D. Minimal reporting required by P1-1/P1-2

Expose pending and rejected-write counts through the collaboration state boundary, with a persistent
UI indication and enough detail to inspect the preserved task intent. A connected transport must
not imply all writes were accepted. Verify the rendered state for pending, rejected, and recovered
uploads, including reopening the screen after a rejection. Keep a general conflict editor and
automatic retry of rejected edits outside this increment; an explicit future retry must revalidate
permissions and use a new logical operation identity.

## 5. Execution order and checkpoints

1. **Reproduce:** add Z1, Q1, and R1 against existing behavior. Record the failing assertions and
   baseline commit. Retain them as regression tests. Run the existing local smoke check once.
2. **Specify:** add the transient, lost-response, acknowledgement, and dependent-operation scenarios.
   Record the outcome policy and failure-storage choice. Leave unsatisfied tests failing.
3. **Fix:** implement outcome handling and durable rejection. Pass Z/Q scenarios before treating
   queue progress as solved; passing queue counts alone is insufficient.
4. **Protect replay:** apply decision gate C and pass all R scenarios. Add backend security tests if
   introducing an RPC/receipts. R2/R3 remain mandatory even if R1 passes after reducing batch size.
5. **Verify the real queue:** run restart, journal, multi-operation, and controlled process-exit tests
   through Electron. Confirm the failure store produces no new synchronized writes.
6. **Verify cloud behavior:** rerun the existing Alice/Bob happy path, then Z1/Z2, Q1, and R1-R4.
   Assert remote rows and the other replica's final data, not just queue drainage.
7. **Verify reporting and gates:** check rejected-state rendering, then run typecheck, lint, and build.
   Record evidence and remaining limitations. Close each P1 separately against its matrix rows.

Fast command: `npm run collaboration:test`.
Existing integration commands: `npm run powersync:groups:test` and
`npm run powersync:groups:cloud`. Required final gates: `npm run typecheck`, `npm run lint`, and
`npm run build`. Execution evidence and the repository-wide lint limitation are recorded in
[p1-hardening-results.md](p1-hardening-results.md).

## 6. Cloud fixtures, reproducibility, and thesis evidence

- Read credentials from the Git-ignored `.env.powersync-groups.local`; never print, commit, or copy
  its passwords, access tokens, or request authorization headers into test reports.
- Create disposable Alice/Bob groups and tasks with exact fixture IDs. An Alice write targeting a
  Bob-only group's known fixture ID can prove permanent RLS rejection followed by a valid Alice
  write without adding a production member-removal feature.
- Use actual deletion by another member for zero-row and delete-replay cases. Trigger response loss
  only after the authenticated backend call has successfully committed; then release Bob's edit and
  retry Alice's upload. Poll with bounded deadlines for replica state, using deterministic barriers
  to order the concurrent actions.
- Do not weaken RLS or add a service-role key to the application to make tests pass. If privileged
  fixture administration is needed, keep it in a separate test setup for a disposable environment.
- The current API cannot delete whole test groups. Record exact created group IDs on success and
  failure and provide a bounded cleanup procedure using the disposable project's administrative
  tooling. Local temporary databases are cleaned automatically. Do not add a group-delete feature
  solely for these tests.
- Give each scenario a machine-readable report: case ID, implementation commit, environment/layer,
  expected outcome, observed remote/replica result, pending/rejected counts, and cleanup IDs.
- Preserve the initial failing evidence and final passing evidence. Document the migration pattern:
  durable local intent -> checked server outcome -> safe acknowledgement -> replica convergence.
  Discuss the trade-offs of rejecting stale edits, server-order conflict resolution, failure storage,
  and any operation receipts. Do not generalize a two-user prototype into a production guarantee.

## Definition of done

- [x] Z1, Q1, and R1 have reproducible failing baseline evidence.
- [x] All required Z/Q/R scenarios pass at their assigned layers.
- [x] Rejected edits are durable, isolated by user, and visible after restart.
- [x] Unrelated valid writes progress after a permanent rejection.
- [x] Transient/auth/unknown failures do not discard intent.
- [x] Accepted operation replay cannot overwrite subsequent edits.
- [x] Existing offline durability, invitation, membership, and two-user convergence checks still pass.
- [x] Any new backend objects have authorization, transaction, and receipt-isolation test evidence.
- [x] Reporting distinguishes local persistence, pending upload, and rejection.
- [x] Typecheck, lint, build, cleanup, and thesis evidence are recorded. Repository-wide lint remains
      unsuccessful because of errors in untouched renderer files; changed files pass lint.

## Reference checks

The installed SDK exposes persistent client-side queue IDs and a separate acknowledgement method;
validate behavior against that installed version during implementation. Relevant upstream references:

- [Supabase update results](https://supabase.com/docs/reference/javascript/update): modified rows
  require explicit result selection.
- [Supabase upsert behavior](https://supabase.com/docs/reference/javascript/upsert): conflict behavior
  must be chosen deliberately.
- [PowerSync Node SDK](https://powersync-ja.github.io/powersync-js/node-sdk/globals): queue, transaction,
  and retry APIs. Current online documentation may differ from the installed version.
