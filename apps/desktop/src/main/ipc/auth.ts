import { randomUUID } from 'node:crypto'
import { ipcMain } from 'electron'
import { eq } from 'drizzle-orm'
import { LoginInput, RegisterInput, type Teacher } from '@offlineclass/shared'

import { hashPassword, verifyPassword } from '../auth/passwords'
import { createSession, resolveSession, revokeSession } from '../auth/sessions'
import { clearActiveToken, loadActiveToken, saveActiveToken } from '../core/sessionStore'
import type { Db } from '../db/client'
import { teachers } from '../db/schema'

export interface AuthContext {
  db: Db
}

export type AuthErrorCode = 'EMAIL_TAKEN' | 'INVALID_CREDENTIALS' | 'NOT_AUTHENTICATED'

export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode
  ) {
    super(message)
  }
}

// Resolves the active session's teacher id; throws AuthError('NOT_AUTHENTICATED')
// if the saved token is missing or stale. Used by every domain handler that
// needs to scope by owner_id (exams, questions, sessions...).
export function requireTeacherId(db: Db): string {
  const token = loadActiveToken()
  if (!token) throw new AuthError('Sessão expirada', 'NOT_AUTHENTICATED')
  const session = resolveSession(db, token)
  if (!session) {
    clearActiveToken()
    throw new AuthError('Sessão expirada', 'NOT_AUTHENTICATED')
  }
  return session.teacherId
}

export function registerAuthHandlers(ctx: AuthContext): void {
  const { db } = ctx

  ipcMain.handle('auth.register', async (_event, raw): Promise<Teacher> => {
    const input = RegisterInput.parse(raw)
    const email = input.email.toLowerCase().trim()

    const existing = db.select().from(teachers).where(eq(teachers.email, email)).get()
    if (existing) throw new AuthError('E-mail já cadastrado', 'EMAIL_TAKEN')

    const passwordHash = await hashPassword(input.password)
    const id = randomUUID()
    db.insert(teachers).values({ id, email, name: input.name, passwordHash }).run()

    const token = createSession(db, id)
    saveActiveToken(token)
    return { id, email, name: input.name }
  })

  ipcMain.handle('auth.login', async (_event, raw): Promise<Teacher> => {
    const input = LoginInput.parse(raw)
    const email = input.email.toLowerCase().trim()

    const row = db.select().from(teachers).where(eq(teachers.email, email)).get()
    if (!row) throw new AuthError('Credenciais inválidas', 'INVALID_CREDENTIALS')

    const ok = await verifyPassword(input.password, row.passwordHash)
    if (!ok) throw new AuthError('Credenciais inválidas', 'INVALID_CREDENTIALS')

    const token = createSession(db, row.id)
    saveActiveToken(token)
    return { id: row.id, email: row.email, name: row.name }
  })

  ipcMain.handle('auth.me', async (): Promise<Teacher | null> => {
    const token = loadActiveToken()
    if (!token) return null
    const session = resolveSession(db, token)
    if (!session) {
      clearActiveToken()
      return null
    }
    return session.teacher
  })

  ipcMain.handle('auth.logout', async (): Promise<null> => {
    const token = loadActiveToken()
    if (token) {
      revokeSession(db, token)
      clearActiveToken()
    }
    return null
  })

  // Returns the active teacher's session token (or null). The renderer
  // needs it to authenticate the teacher-side WebSocket. Safe to expose
  // inside the renderer process — context isolation keeps it from page
  // scripts, and the token is the same one persisted to userData.
  ipcMain.handle('auth.getToken', async (): Promise<string | null> => {
    const token = loadActiveToken()
    if (!token) return null
    const session = resolveSession(db, token)
    return session ? token : null
  })
}
