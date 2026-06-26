import { eq } from 'drizzle-orm'
import type { EmailSettings, EmailSettingsInput } from '@offlineclass/shared'

import type { Db } from '../db/client'
import { emailSettings } from '../db/schema'

/** Read the teacher's SMTP config (null when never configured). */
export function getEmailSettings(db: Db, ownerId: string): EmailSettings | null {
  const row = db.select().from(emailSettings).where(eq(emailSettings.ownerId, ownerId)).get()
  if (!row) return null
  return {
    host: row.host,
    port: row.port,
    secure: row.secure,
    username: row.username,
    password: row.password,
    fromName: row.fromName,
    fromEmail: row.fromEmail
  }
}

/** Upsert the teacher's SMTP config (owner_id is the primary key). */
export function saveEmailSettings(
  db: Db,
  ownerId: string,
  input: EmailSettingsInput
): EmailSettings {
  const now = new Date()
  db.insert(emailSettings)
    .values({ ownerId, ...input, updatedAt: now })
    .onConflictDoUpdate({ target: emailSettings.ownerId, set: { ...input, updatedAt: now } })
    .run()
  // Always present right after the upsert.
  return getEmailSettings(db, ownerId) as EmailSettings
}
