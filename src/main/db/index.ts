import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import * as schema from './schema'

export const sqlite = new Database(path.join(__dirname, 'databasefile.db'))
export const db = drizzle(sqlite, { schema })

export * from './schema'
