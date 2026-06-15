import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'
import { ProviderIdSchema } from '@shared/ipc/provider'
import type { z } from 'zod'

type ProviderId = z.infer<typeof ProviderIdSchema>

/* Tiny JSON store for the user's chosen default AI provider. Lives in userData
   so it survives restarts and is readable by the main process (where the SDK
   generation will run). No secret is stored — Claude Code holds its own login. */

function storePath(): string {
  return join(app.getPath('userData'), 'provider.json')
}

/** The persisted default provider, or `null` when nothing has been saved yet
    (or the file is missing/corrupt). Never throws. */
export function readDefaultProvider(): ProviderId | null {
  try {
    const path = storePath()
    if (!existsSync(path)) return null
    const raw = JSON.parse(readFileSync(path, 'utf8')) as { defaultProviderId?: unknown }
    const parsed = ProviderIdSchema.safeParse(raw?.defaultProviderId)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Persist the default provider. Best-effort — logs and swallows write errors so
    a disk hiccup never blocks finishing onboarding. */
export function writeDefaultProvider(providerId: ProviderId): void {
  try {
    writeFileSync(storePath(), JSON.stringify({ defaultProviderId: providerId }, null, 2))
  } catch (err) {
    console.error('[provider-store] failed to persist default provider:', err)
  }
}
