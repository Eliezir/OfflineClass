import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { app } from 'electron'
import { join } from 'node:path'

import type { Db } from './client'

// In dev, app.getAppPath() resolves to apps/desktop/ and the SQL files live in
// src/main/db/migrations/ alongside the schema. In a packaged build src/ is
// excluded from the app bundle, so electron-builder copies the migrations
// folder into the app's resources via the `extraResources` block — it lives at
// <resources>/migrations there.
export function runMigrations(db: Db): void {
  const migrationsFolder = app.isPackaged
    ? join(process.resourcesPath, 'migrations')
    : join(app.getAppPath(), 'src/main/db/migrations')
  migrate(db, { migrationsFolder })
}
