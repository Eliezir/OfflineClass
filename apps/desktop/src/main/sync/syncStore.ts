/**
 * Persists cloud sync credentials at userData/sync-credentials.json.
 * Mirrors the pattern of core/sessionStore.ts (active-session.json).
 * Plain file — no encryption yet (Q-202 UX deferred).
 */
import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface SyncCredentials {
  /** URL of the backend connector (e.g. http://localhost:3001) */
  connectorUrl: string
  /** URL of the PowerSync Service (e.g. http://localhost:8080) */
  powersyncUrl: string
  /** JWT signed by the connector; sub = cloudOwnerId */
  token: string
  /** Expiry epoch ms */
  expiresAt: number
  /** Whether sync is enabled (toggle "stay local" is OFF) */
  enabled: boolean
  /**
   * JWT `sub` claim — the cloud account's canonical owner_id.
   * = the `localTeacherId` of the device that first registered this cloud account.
   * Used as `owner_id` in the PowerSync managed DB so all devices share the same namespace.
   * May differ from the current device's local teacher UUID on a 2nd device.
   */
  cloudOwnerId: string
}

function pathFor(): string {
  return join(app.getPath('userData'), 'sync-credentials.json')
}

export function saveSyncCredentials(creds: SyncCredentials): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(pathFor(), JSON.stringify(creds), 'utf-8')
}

export function loadSyncCredentials(): SyncCredentials | null {
  const file = pathFor()
  if (!existsSync(file)) return null
  try {
    const raw = JSON.parse(readFileSync(file, 'utf-8')) as Partial<SyncCredentials>
    if (
      typeof raw.connectorUrl === 'string' &&
      typeof raw.powersyncUrl === 'string' &&
      typeof raw.token === 'string' &&
      typeof raw.expiresAt === 'number' &&
      typeof raw.enabled === 'boolean' &&
      typeof raw.cloudOwnerId === 'string'
    ) {
      return raw as SyncCredentials
    }
    return null
  } catch {
    return null
  }
}

export function clearSyncCredentials(): void {
  const file = pathFor()
  if (existsSync(file)) unlinkSync(file)
}
