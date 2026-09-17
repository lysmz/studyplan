# OpenAPI IPC contract

`openapi.yaml` is the source of truth for the desktop API contract. Every operation must have a
unique `operationId` and a tag. The generator maps path, query, and JSON request-body values into a
single IPC input object and emits shared Zod schemas, TypeScript models, operation metadata, and a
tag-grouped renderer client.

The previous Orval contract used `useDates: true`, so OpenAPI `date-time` values are normalized to
JavaScript `Date` objects on this IPC boundary. Both generated TypeScript types and runtime
validators require `Date`, avoiding a string/Date mismatch.

Run `npm run api:generate` after editing the contract. Run `npm run api:check` in CI to fail when
generated output is stale. Shared transport files live in `src/shared/api/generated`. Renderer-only
React Query hooks live in `src/renderer/src/api/generated`, with compatibility exports from
`src/renderer/src/api`. Generated files must not be edited by hand.

The main process implements operations through `PartialApiHandlerRegistry` while work is in
progress. `defineApiHandlers` requires a complete implementation and is the intended final compile-
time completeness check. The dispatcher validates requests and responses and returns serializable
error envelopes. Business-aware React Query hooks and cache invalidation should wrap `window.api`
through the generated renderer layer. The hooks use operation IDs and normalized IPC inputs for
query keys. Business-specific invalidation remains in the pages and services that understand those
relationships.

React Query supplies an `AbortSignal`, but the current IPC protocol does not carry cancellation to
the main process. A query that becomes stale is ignored by React Query while its main-process work
continues to completion.
