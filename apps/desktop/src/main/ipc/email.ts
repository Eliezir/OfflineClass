import { ipcMain } from 'electron'
import { EmailSettingsInput, type EmailSettings, type EmailTestResult } from '@offlineclass/shared'

import { requireTeacherId } from './auth'
import type { Db } from '../db/client'
import { getEmailSettings, saveEmailSettings } from '../email/store'
import { verifyEmailSettings } from '../email/send'

export interface EmailContext {
  db: Db
}

export function registerEmailHandlers(ctx: EmailContext): void {
  const { db } = ctx

  ipcMain.handle('email.getSettings', async (): Promise<EmailSettings | null> => {
    const ownerId = requireTeacherId(db)
    return getEmailSettings(db, ownerId)
  })

  ipcMain.handle('email.saveSettings', async (_event, raw): Promise<EmailSettings> => {
    const ownerId = requireTeacherId(db)
    const input = EmailSettingsInput.parse(raw)
    return saveEmailSettings(db, ownerId, input)
  })

  // Verify the SMTP connection/auth without persisting — powers the "Testar
  // conexão" button so the teacher can validate credentials before saving.
  ipcMain.handle('email.test', async (_event, raw): Promise<EmailTestResult> => {
    requireTeacherId(db)
    const input = EmailSettingsInput.parse(raw)
    return verifyEmailSettings(input)
  })
}
