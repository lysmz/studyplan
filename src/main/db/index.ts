import { app } from 'electron'
import { createClient, Client } from '@libsql/client'
import { drizzle, LibSQLDatabase } from 'drizzle-orm/libsql'
import path from 'path'
import * as schema from './schema'

export let client: Client
export let db: LibSQLDatabase<typeof schema>

export async function initDatabase(): Promise<LibSQLDatabase<typeof schema>> {
  const dbPath = app.isPackaged
    ? path.join(app.getPath('userData'), 'databasefile.db')
    : path.join(__dirname, 'databasefile.db')

  client = createClient({
    url: `file:${dbPath}`
  })

  db = drizzle(client, { schema })

  // Verify connection by running a query
  await client.execute('SELECT 1')
  console.log(`[DB] Connected to database at: ${dbPath}`)

  return db
}

export * from './schema'
