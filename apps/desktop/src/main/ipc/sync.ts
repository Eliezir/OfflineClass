/**
 * IPC handlers for cloud sync — exposed to the renderer as window.api.sync.*
 *
 * All handlers are additive and isolated to the sync module.
 * No existing handler or schema is modified.
 *
 * Channels:
 *   sync.getStatus       — current sync state (enabled, linked, status)
 *   sync.linkAccount     — register/login cloud account and store credentials
 *   sync.enable          — turn sync on (was stay-local)
 *   sync.disable         — turn sync off (back to stay-local)
 *   sync.trigger         — manually kick off a sync round
 *   sync.unlinkAccount   — remove cloud credentials
 */
import { ipcMain } from 'electron'
import { saveSyncCredentials, loadSyncCredentials, clearSyncCredentials } from '../sync/syncStore'
import { syncConnect, syncDisconnect, isSyncConnected } from '../sync/client'
import { runBridge } from '../sync/bridge'
import { requireTeacherId } from './auth'
import type { Db } from '../db/client'

/** Decode the payload of a JWT (no signature verification) and return the `sub` claim. */
function decodeJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1]!, 'base64').toString('utf-8')) as {
      sub?: string
    }
    return typeof payload.sub === 'string' ? payload.sub : null
  } catch {
    return null
  }
}

export interface SyncStatus {
  enabled: boolean
  linked: boolean
  connected: boolean
  /** 'idle' | 'syncing' | 'error' | 'unlinked' */
  state: string
}

export interface SyncContext {
  db: Db
}

export function registerSyncHandlers({ db }: SyncContext): void {
  ipcMain.handle('sync.getStatus', async (): Promise<SyncStatus> => {
    const creds = loadSyncCredentials()
    return {
      enabled: creds?.enabled ?? false,
      linked: creds != null,
      connected: isSyncConnected(),
      state: creds == null
        ? 'unlinked'
        : !creds.enabled
          ? 'idle'
          : isSyncConnected()
            ? 'idle'
            : 'idle'
    }
  })

  /**
   * Register or login to the cloud account and save credentials.
   * The renderer calls this from the "vincular conta cloud" modal (Phase 7).
   */
  ipcMain.handle(
    'sync.linkAccount',
    async (
      _event,
      raw: {
        connectorUrl: string
        email: string
        password: string
        mode: 'register' | 'login'
      }
    ): Promise<{ ok: true } | { ok: false; error: string }> => {
      try {
        const localTeacherId = requireTeacherId(db)
        const { connectorUrl, email, password, mode } = raw

        const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login'
        const body =
          mode === 'register'
            ? { email, password, name: email, localTeacherId }
            : { email, password }

        const res = await fetch(`${connectorUrl}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        })

        if (!res.ok) {
          const err = (await res.json().catch(() => ({ error: res.statusText }))) as { error?: string }
          return { ok: false, error: err.error ?? `HTTP ${res.status}` }
        }

        const data = (await res.json()) as {
          token: string
          expiresAt: number
          powersyncUrl: string
        }

        // Decode JWT payload (no verify needed — already validated by the connector)
        const cloudOwnerId = decodeJwtSub(data.token) ?? localTeacherId

        saveSyncCredentials({
          connectorUrl,
          powersyncUrl: data.powersyncUrl,
          token: data.token,
          expiresAt: data.expiresAt,
          enabled: false, // stay-local is still ON; teacher must explicitly enable
          cloudOwnerId
        })

        return { ok: true }
      } catch (err: unknown) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle('sync.enable', async (): Promise<{ ok: boolean; error?: string }> => {
    const creds = loadSyncCredentials()
    if (!creds) return { ok: false, error: 'No cloud account linked. Call sync.linkAccount first.' }
    saveSyncCredentials({ ...creds, enabled: true })
    await syncConnect()
    return { ok: true }
  })

  ipcMain.handle('sync.disable', async (): Promise<void> => {
    const creds = loadSyncCredentials()
    if (creds) saveSyncCredentials({ ...creds, enabled: false })
    await syncDisconnect()
  })

  /**
   * Manually kick off a bridge + sync round.
   * Bridge pushes local → managed DB (generating ps_crud for upload).
   * PowerSync's uploadData() picks up ps_crud and sends to connector.
   */
  ipcMain.handle('sync.trigger', async (): Promise<{ ok: boolean; error?: string }> => {
    if (!isSyncConnected()) {
      return { ok: false, error: 'Sync not connected. Enable sync first.' }
    }
    try {
      const localTeacherId = requireTeacherId(db)
      const creds = loadSyncCredentials()
      const cloudOwnerId = creds?.cloudOwnerId ?? localTeacherId
      const result = await runBridge(db, localTeacherId, cloudOwnerId)
      if (result?.error) return { ok: false, error: result.error }
      return { ok: true }
    } catch (err: unknown) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('sync.unlinkAccount', async (): Promise<void> => {
    await syncDisconnect()
    clearSyncCredentials()
  })
}
