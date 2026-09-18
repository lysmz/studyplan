import { app } from 'electron'
import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import * as schema from './schema'

export type AppDatabase = LibSQLDatabase<typeof schema>

export let client: Client
export let db: AppDatabase

function getDatabasePath(): string {
  const filename = app.isPackaged ? 'studyplan.db' : 'studyplan-dev.db'
  return join(app.getPath('userData'), 'data', filename)
}

function getMigrationsPath(): string {
  return app.isPackaged ? join(process.resourcesPath, 'drizzle') : join(app.getAppPath(), 'drizzle')
}

export async function initDatabase(): Promise<LibSQLDatabase<typeof schema>> {
  const dbPath = getDatabasePath()
  const migrationsPath = getMigrationsPath()

  await mkdir(join(app.getPath('userData'), 'data'), { recursive: true })

  client = createClient({
    url: `file:${dbPath}`
  })

  db = drizzle(client, { schema })

  await client.execute('PRAGMA foreign_keys = ON')
  await client.execute('PRAGMA journal_mode = WAL')

  // drizzle-orm 0.45.2 creates this table with a PostgreSQL-style SERIAL id.
  // Creating the SQLite version first keeps the built-in migrator reliable.
  await client.execute(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at NUMERIC
    )
  `)

  await migrate(db, { migrationsFolder: migrationsPath })
  await client.execute('SELECT 1')

  console.log(`[DB] Ready at: ${dbPath}`)

  return db
}

export function closeDatabase(): void {
  client?.close()
}

export * from './schema'
