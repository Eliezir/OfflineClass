/**
 * Connector migration runner.
 * Reads all .sql files from src/migrations/ in lexical order and applies them
 * to the source Postgres (pg-db). Uses CREATE TABLE IF NOT EXISTS / DO $$ ... $$
 * guards so it is idempotent and safe to re-run on every connector startup.
 *
 * Usage: tsx src/migrate.ts   (or via docker CMD)
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import postgres from 'postgres'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const url = process.env['CONNECTOR_DATABASE_URL']
if (!url) throw new Error('CONNECTOR_DATABASE_URL env var is required')

async function main(): Promise<void> {
  const sql = postgres(url!, { max: 1 })
  try {
    const migrationsDir = path.join(__dirname, 'migrations')
    const files = (await fs.readdir(migrationsDir))
      .filter((f) => f.endsWith('.sql'))
      .sort()

    for (const file of files) {
      const content = await fs.readFile(path.join(migrationsDir, file), 'utf8')
      console.log(`[migrate] Applying ${file}…`)
      await sql.unsafe(content)
      console.log(`[migrate]   done.`)
    }

    console.log('[migrate] All migrations applied.')
  } finally {
    await sql.end()
  }
}

main().catch((err: unknown) => {
  console.error('[migrate] Failed:', err)
  process.exit(1)
})
