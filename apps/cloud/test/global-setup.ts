import { execFileSync } from 'node:child_process'
import { rmSync } from 'node:fs'
import path from 'node:path'

// Roda uma vez antes de toda a suíte: recria o banco de teste SQLite e aplica
// as migrations (substitui o H2 in-memory do backend Java). Usa caminho
// ABSOLUTO para evitar a ambiguidade de `file:` relativo do Prisma.
export default function setup(): void {
  const backendRoot = path.resolve(import.meta.dirname, '..')
  const dbPath = path.resolve(backendRoot, 'prisma', 'test.db')
  const databaseUrl = `file:${dbPath}`
  const prismaCli = path.resolve(backendRoot, 'node_modules', 'prisma', 'build', 'index.js')

  rmSync(dbPath, { force: true })
  rmSync(`${dbPath}-journal`, { force: true })

  execFileSync(process.execPath, [prismaCli, 'migrate', 'deploy'], {
    cwd: backendRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit'
  })
}
