/**
 * PowerSyncBackendConnector for OfflineClass.
 *
 * fetchCredentials() — loads stored JWT; refreshes via connector /api/auth/token.
 * uploadData()       — sends CRUD batch from ps_crud to connector /api/upload.
 *
 * The connector never touches offlineclass.db directly — that is the bridge's job
 * (Phase 4). This module only handles the PowerSync ↔ cloud data path.
 */
import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector, PowerSyncCredentials } from '@powersync/node'
import { loadSyncCredentials, saveSyncCredentials } from './syncStore'

export class OfflineClassConnector implements PowerSyncBackendConnector {
  async fetchCredentials(): Promise<PowerSyncCredentials | null> {
    const stored = loadSyncCredentials()
    if (!stored || !stored.enabled) return null

    // Refresh the token if it has less than 5 minutes left
    const fiveMinMs = 5 * 60 * 1000
    if (stored.expiresAt - Date.now() > fiveMinMs) {
      return {
        endpoint: stored.powersyncUrl,
        token: stored.token,
        expiresAt: new Date(stored.expiresAt)
      }
    }

    try {
      const res = await fetch(`${stored.connectorUrl}/api/auth/token`, {
        headers: { Authorization: `Bearer ${stored.token}` }
      })
      if (!res.ok) return null
      const body = (await res.json()) as { token: string; expiresAt: number; powersyncUrl: string }
      saveSyncCredentials({
        ...stored,
        token: body.token,
        expiresAt: body.expiresAt,
        powersyncUrl: body.powersyncUrl
      })
      return {
        endpoint: body.powersyncUrl,
        token: body.token,
        expiresAt: new Date(body.expiresAt)
      }
    } catch {
      return null
    }
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    const stored = loadSyncCredentials()
    if (!stored || !stored.enabled) return

    const transaction = await database.getNextCrudTransaction()
    if (!transaction) return

    const batch = transaction.crud.map((entry) => ({
      op: entry.op,
      table: entry.table,
      id: entry.id,
      data: entry.opData
    }))

    try {
      const res = await fetch(`${stored.connectorUrl}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${stored.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ batch })
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Upload failed (${res.status}): ${text}`)
      }

      await transaction.complete()
    } catch (err) {
      // Rethrow — PowerSync SDK will retry after the configured wait period
      throw err
    }
  }
}
