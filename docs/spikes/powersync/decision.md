# PowerSync spike decision

## Current decision

**Go for a bounded pilot; no production migration yet.** Local-first durability, additive client
schema evolution, the main-process security boundary, packaged Electron execution, cloud-backed
two-device convergence and cross-user isolation are demonstrated.

## Preliminary score

| Criterion                            | Result | Reason                                                        |
| ------------------------------------ | -----: | ------------------------------------------------------------- |
| Electron and packaging compatibility |  30/30 | Development build and packaged Windows executable pass        |
| Offline persistence and convergence  |  25/25 | Restart durability and Alice A-to-B convergence pass          |
| Integration effort                   |  18/20 | Isolated main-process adapter; no current feature migration    |
| Schema evolution                     |  15/15 | Existing v1 row survives additive v2 schema and remains usable |
| Security boundary                    |  10/10 | Renderer isolation and Supabase RLS read/write probes pass    |
| **Total**                            | **98/100** | **All hard-stop checks pass**                              |

## Interpretation rule

- **Go:** score at least 70/100, with packaged Electron execution, offline durability, convergence,
  and user isolation all passing.
- **Conditional Go:** local and packaged execution pass, but only the externally provisioned cloud
  checks remain. This authorizes a bounded follow-up evaluation, not migration of production data.
- **No-Go:** any hard-stop criterion in `plan.md` fails.
