import { homedir } from 'node:os'
import { join } from 'node:path'
import { defineConfig } from 'drizzle-kit'

// At runtime the app opens the DB at app.getPath('userData')/offlineclass.db.
// For `db:studio` we resolve that same path so Studio shows real data. The
// userData dir mirrors Electron's app name ("@offlineclass/desktop" in dev).
// Override with OFFLINECLASS_DB_URL to inspect a different database.
function runtimeDbPath(): string {
  const appDir = join('@offlineclass', 'desktop')
  const base =
    process.platform === 'darwin'
      ? join(homedir(), 'Library', 'Application Support')
      : process.platform === 'win32'
        ? (process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
        : (process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'))
  return `file:${join(base, appDir, 'offlineclass.db')}`
}

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema.ts',
  out: './src/main/db/migrations',
  dbCredentials: {
    url: process.env.OFFLINECLASS_DB_URL ?? runtimeDbPath()
  },
  strict: true,
  verbose: true
})
