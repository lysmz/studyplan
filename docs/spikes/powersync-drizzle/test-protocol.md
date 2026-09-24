# Test protocol

## 1. Local automated check

```powershell
npm run powersync:drizzle:test
```

This builds the Electron bundles and runs the headless main-process test. It verifies the existing
schema assessment, typed CRUD/filtering, restart durability, the upload queue and delete/returning.

## 2. Supabase and PowerSync preparation

Run
`spike/powersync-drizzle/supabase/migrations/0003_create_spike_events.sql` once in the disposable
Supabase project's SQL editor. Then replace the deployed PowerSync sync-stream configuration with
`spike/powersync-drizzle/sync-streams-v3.yaml` and deploy it.

Do not place a service-role key in the application. The test needs only the publishable/anon key and
the passwords of the disposable Alice and Bob users.

## 3. Cloud check

Set these environment variables in the current shell without writing passwords to the repository:

```powershell
$env:POWERSYNC_SPIKE_ENDPOINT = 'https://your-instance.powersync.journeyapps.com'
$env:SUPABASE_URL = 'https://your-project.supabase.co'
$env:SUPABASE_PUBLISHABLE_KEY = 'your-publishable-key'
$env:POWERSYNC_SPIKE_ALICE_EMAIL = 'alice@example.com'
$env:POWERSYNC_SPIKE_ALICE_PASSWORD = '<local secret>'
$env:POWERSYNC_SPIKE_BOB_EMAIL = 'bob@example.com'
$env:POWERSYNC_SPIKE_BOB_PASSWORD = '<local secret>'
npm run powersync:drizzle:cloud
```

The harness creates three temporary local replicas, uploads an Alice event, waits for Alice device B
to receive it, checks Bob's empty replica, probes forbidden Bob insert/update operations through
Supabase RLS, deletes the test event and removes the temporary databases.

## 4. Packaged check

```powershell
npx electron-builder --dir
dist\win-unpacked\studyplan.exe --powersync-drizzle-spike-test
```

The packaged process must emit a JSON report with `"result": "pass"`.
