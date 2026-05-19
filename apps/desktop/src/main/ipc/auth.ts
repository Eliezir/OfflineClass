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

export class AuthError extends Error {
  constructor(
    message: string,
    public code: 'EMAIL_TAKEN' | 'INVALID_CREDENTIALS'
  ) {
    super(message)
  }
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
}
