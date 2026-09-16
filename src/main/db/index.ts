import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import path from 'path'
import * as schema from './schema'

export const client = createClient({
  url: `file:${path.join(__dirname, 'databasefile.db')}`
})

export const db = drizzle(client, { schema })

export * from './schema'
