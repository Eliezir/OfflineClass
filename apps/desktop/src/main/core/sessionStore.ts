import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

// Stores the active teacher's session token at userData/active-session.json
// so reopening the app keeps the teacher logged in. Plain file because
// nothing else needs to read it; refresh tokens etc. would live in the DB.

function pathFor(): string {
  return join(app.getPath('userData'), 'active-session.json')
}

export function saveActiveToken(token: string): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(pathFor(), JSON.stringify({ token }), 'utf-8')
}

export function loadActiveToken(): string | null {
  const file = pathFor()
  if (!existsSync(file)) return null
  try {
    const parsed = JSON.parse(readFileSync(file, 'utf-8')) as { token?: unknown }
    return typeof parsed.token === 'string' ? parsed.token : null
  } catch {
    return null
  }
}

export function clearActiveToken(): void {
  const file = pathFor()
  if (existsSync(file)) unlinkSync(file)
}
