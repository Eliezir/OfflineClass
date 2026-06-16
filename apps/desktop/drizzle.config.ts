import { defineConfig } from 'drizzle-kit'

// Migrations are generated against an arbitrary local file path; at runtime
// the app opens the DB at app.getPath('userData')/offlineclass.db instead.
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema.ts',
  out: './src/main/db/migrations',
  dbCredentials: {
    url: 'file:./.drizzle/offlineclass.db'
  },
  strict: true,
  verbose: true
})
