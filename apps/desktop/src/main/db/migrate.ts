import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import { join } from 'node:path'

import type { Db } from './client'

// In dev, app.getAppPath() resolves to apps/desktop/ and the SQL files live
// in src/main/db/migrations/ alongside the schema. In a packaged build the
// migrations folder needs to be copied into the asar/resources layout — Stage
// 7 (electron-builder polish) will handle that.
export function runMigrations(db: Db): void {
  const migrationsFolder = join(app.getAppPath(), 'src/main/db/migrations')
  migrate(db, { migrationsFolder })
}
