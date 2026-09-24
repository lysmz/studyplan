# PowerSync spike test protocol

## Automated local checks

```powershell
npm run powersync:test
npm run powersync:smoke
npm run typecheck
npx electron-builder --dir
```

The test mode launches the compiled Electron main process without creating a browser window. It
creates databases only in a generated operating-system temporary directory and removes that
directory after each run. Running through Electron is intentional: `better-sqlite3` is rebuilt for
the Electron ABI and must not be validated through the separately installed system Node runtime.

To capture evidence from the unpacked GUI-subsystem executable, pass an explicit report path:

```powershell
.\dist\win-unpacked\studyplan.exe --powersync-spike-test `
  --powersync-spike-report=C:\absolute\path\to\powersync-spike-report.json
```

The repository's normal `npm run build:unpack` remains the preferred final command after its
separate generated-API baseline is clean. For this spike, `npm run powersync:test` produces the
production bundle first, and `npx electron-builder --dir` isolates the packaging check from that
unrelated gate.

## Cloud setup

1. Create a disposable Supabase project and two email/password test users.
2. Apply `spike/powersync/supabase/migrations/0001_create_spike_tasks.sql`.
3. Configure a PowerSync instance against the Supabase Postgres database.
4. Deploy `spike/powersync/sync-streams-v1.yaml`.
5. Copy `.env.powersync-spike.example` to an untracked environment file and provide the values
   to the Electron process. Never package that file.

## Device and authorization test

1. Start device A with `POWERSYNC_SPIKE_DEVICE_ID=device-a` and Alice's credentials.
2. Disconnect it, create/update a row locally, restart, and confirm the row and queue survive.
3. Reconnect and wait until the upload queue reaches zero.
4. Start device B with `POWERSYNC_SPIKE_DEVICE_ID=device-b` and Alice's credentials. Confirm the
   row downloads.
5. Start device C with Bob's credentials. Confirm Alice's rows are absent.
6. Attempt a direct insert/update with Alice's `owner_id` while authenticated as Bob. Supabase
   must reject it through row-level security.

## Schema evolution test

1. Keep one v1 client and at least one existing v1 row.
2. Apply `0002_add_priority.sql`.
3. Deploy `sync-streams-v2.yaml` and wait for PowerSync reprocessing.
4. Start the v2 client and set `priority`.
5. Confirm the v1 client can still read and update the row's old fields.
6. Confirm a v2 client receives the priority value after reconnecting.

## Evidence to retain

- Exact package versions from `package-lock.json`.
- Test and build output.
- PowerSync upload queue counts before and after reconnect.
- Screenshots or logs from the three-device authorization test.
- Problems encountered and time spent per activity.
