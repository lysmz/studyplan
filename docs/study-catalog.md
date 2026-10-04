# Public sample study catalog

Opening Studie reads the existing SQLite catalog immediately and invokes `refreshStudyCatalog`
over the generated IPC API. The main process downloads JSON, parses the program/course fields,
upserts both arrays in one transaction, and returns their counts. The page then refreshes its
program and course queries. A failed refresh leaves the existing local data available and shows
a retry button.

The public endpoint is:

https://repsgcypslupjhdbtcjm.supabase.co/functions/v1/study-catalog

It serves `supabase/functions/study-catalog/catalog.json`: three fictional sample programs
(Physik, Elektrotechnik, Psychologie) with four courses each. Program IDs 6–8 and course IDs 34–45
follow the bundled seed IDs. Repeat visits update those rows without adding duplicates. Imports
do not remove rows missing from the downloaded JSON.

The Supabase Edge Function serves the JSON without authentication or database access.
`supabase/config.toml` records its public configuration. To change the online examples, edit
`catalog.json` and redeploy the `study-catalog` function to project `repsgcypslupjhdbtcjm`, including
both `index.ts` and `catalog.json`. Editing the local file alone does not update the hosted copy.

Set the main-process environment variable `STUDY_CATALOG_URL` before starting the app to fetch
from another endpoint during development. Restart the app after changing it. Downloads time out
after ten seconds; concurrent refresh calls share the same import.

This is a small example for future security hardening. The external-data path is:

`HTTP response → JSON parsing → field validation → SQLite upsert → IPC read → React rendering`

It uses the existing shared field schemas, Drizzle's parameterized writes, and React text rendering.
It has no release management, catalog provenance verification, deletion reconciliation, or additional
catalog database tables. The selected URL and its responses are the input to the later hardening
exercise.

Run `npm run study-programs:test` to verify the download/import path, duplicate handling, updates,
failure recovery, rollback, and concurrent calls.
