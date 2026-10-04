// SQLite 13 and libSQL ship N-API binaries. Verify loading in Electron instead of
// asking node-gyp to compile a binary already supplied for this platform.
const assert = require('node:assert/strict')
const { spawnSync } = require('node:child_process')

async function check() {
  assert.ok(process.versions.electron, 'Native check must run in Electron')
  const Database = require('better-sqlite3')
  const sqlite = new Database(':memory:')
  try {
    sqlite.exec('CREATE TABLE smoke (value TEXT)')
    sqlite.prepare('INSERT INTO smoke VALUES (?)').run('BA-native-check')
    assert.equal(sqlite.prepare('SELECT value FROM smoke').get().value, 'BA-native-check')
  } finally {
    sqlite.close()
  }
  const { createClient } = require('@libsql/client')
  const client = createClient({ url: ':memory:' })
  try {
    assert.equal((await client.execute('SELECT 1 AS value')).rows[0].value, 1)
  } finally {
    client.close()
  }
  console.log(
    JSON.stringify(
      {
        electron: process.versions.electron,
        node: process.versions.node,
        napi: process.versions.napi,
        betterSqlite3: require('better-sqlite3/package.json').version,
        sqliteReadWrite: 'pass',
        libSqlRead: 'pass'
      },
      null,
      2
    )
  )
}

if (process.argv.includes('--electron')) {
  check().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
} else {
  const result = spawnSync(require('electron'), [__filename, '--electron'], {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
    windowsHide: true
  })
  if (result.error) throw result.error
  process.exitCode = result.status ?? 1
}
