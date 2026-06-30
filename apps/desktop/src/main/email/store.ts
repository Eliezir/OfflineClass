import { eq } from 'drizzle-orm'
import { safeStorage } from 'electron'
import type { EmailSettings, EmailSettingsInput } from '@offlineclass/shared'

import type { Db } from '../db/client'
import { emailSettings } from '../db/schema'

/** Encrypt a secret for at-rest storage via the OS keychain (Keychain on macOS,
    DPAPI on Windows, libsecret on Linux). Returns '' for an empty secret. Throws
    when the platform has no secure-storage backend, so we never silently fall
    back to plaintext. */
function encryptSecret(plain: string): string {
  if (!plain) return ''
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('Armazenamento seguro indisponível neste sistema')
  }
  return safeStorage.encryptString(plain).toString('base64')
}

/** Decrypt a stored secret; returns '' when empty or undecryptable (e.g. a
    legacy plaintext value, or the keychain is unavailable). */
function decryptSecret(stored: string): string {
  if (!stored) return ''
  try {
    return safeStorage.decryptString(Buffer.from(stored, 'base64'))
  } catch {
    return ''
  }
}

/** Read the teacher's SMTP config for the renderer — WITHOUT the password (only
    whether one is set). Null when never configured. */
export function getEmailSettings(db: Db, ownerId: string): EmailSettings | null {
  const row = db.select().from(emailSettings).where(eq(emailSettings.ownerId, ownerId)).get()
  if (!row) return null
  return {
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    hasPassword: row.password !== '',
    fromName: row.fromName,
    fromEmail: row.fromEmail
  }
}

/** Main-process only: the full config WITH the decrypted password, for opening
    the SMTP connection. This must never cross the IPC boundary. */
export function getEmailSecret(db: Db, ownerId: string): EmailSettingsInput | null {
  const row = db.select().from(emailSettings).where(eq(emailSettings.ownerId, ownerId)).get()
  if (!row) return null
  return {
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    password: decryptSecret(row.password),
    fromName: row.fromName,
    fromEmail: row.fromEmail
  }
}

/** Upsert the teacher's SMTP config (owner_id is the primary key). The password
    is encrypted at rest; an empty incoming password keeps the existing one. */
export function saveEmailSettings(
  db: Db,
  ownerId: string,
  input: EmailSettingsInput
): EmailSettings {
  const existing = db
    .select({ password: emailSettings.password })
    .from(emailSettings)
    .where(eq(emailSettings.ownerId, ownerId))
    .get()
  // Empty password on save = "keep the stored one"; otherwise encrypt the new one.
  const password =
    input.password === '' ? (existing?.password ?? '') : encryptSecret(input.password)
  const now = new Date()
  const values = { ...input, password }
  db.insert(emailSettings)
    .values({ ownerId, ...values, updatedAt: now })
    .onConflictDoUpdate({ target: emailSettings.ownerId, set: { ...values, updatedAt: now } })
    .run()
  // Always present right after the upsert.
  return getEmailSettings(db, ownerId) as EmailSettings
}
