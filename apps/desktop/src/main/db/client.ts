import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { app } from 'electron'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

import * as schema from './schema'

export type Db = BetterSQLite3Database<typeof schema>

let cached: Db | null = null

export function getDb(): Db {
  if (cached) return cached
  const userDataPath = app.getPath('userData')
  mkdirSync(userDataPath, { recursive: true })
  const dbPath = join(userDataPath, 'offlineclass.db')
  const sqlite = new Database(dbPath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  cached = drizzle(sqlite, { schema })
  return cached
}
