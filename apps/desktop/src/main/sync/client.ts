/**
 * PowerSyncDatabase singleton for OfflineClass.
 *
 * The managed SQLite lives at userData/powersync.db (separate from offlineclass.db).
 * Initialization is lazy — the DB is only opened when getOrCreatePowerSyncDb() is called.
 * Connection to the PowerSync Service is separate: call syncConnect() / syncDisconnect().
 *
 * Stay-local mode (default ON): DB is initialized but NOT connected.
 * Sync enabled: DB is connected to the PowerSync Service via the connector.
 */
import path from 'node:path'
import { app } from 'electron'
import { PowerSyncDatabase } from '@powersync/node'
import { AppSchema } from './schema'
import { OfflineClassConnector } from './connector'
import { loadSyncCredentials } from './syncStore'

let _db: PowerSyncDatabase | null = null
let _connected = false

/** Returns the PowerSync managed DB instance (creates it if needed). */
export function getOrCreatePowerSyncDb(): PowerSyncDatabase {
  if (!_db) {
    const dbPath = path.join(app.getPath('userData'), 'powersync.db')
    _db = new PowerSyncDatabase({
      schema: AppSchema,
      database: { dbFilename: dbPath }
    })
  }
  return _db
}

/**
 * Connects the PowerSync DB to the cloud Service.
 * No-op if already connected or if stay-local mode is ON.
 */
export async function syncConnect(): Promise<void> {
  const creds = loadSyncCredentials()
  if (!creds?.enabled) return

  const db = getOrCreatePowerSyncDb()
  if (_connected) return

  await db.connect(new OfflineClassConnector())
  _connected = true
  console.log('[sync] Connected to PowerSync Service')
}

/**
 * Disconnects from the PowerSync Service.
 * Does NOT close the managed DB (data remains available offline).
 */
export async function syncDisconnect(): Promise<void> {
  if (!_db || !_connected) return
  await _db.disconnect()
  _connected = false
  console.log('[sync] Disconnected from PowerSync Service')
}

/** Whether the PowerSync client is currently connected to the cloud Service. */
export function isSyncConnected(): boolean {
  return _connected
}

/** Closes the managed DB entirely (call on app quit). */
export async function closePowerSyncDb(): Promise<void> {
  if (!_db) return
  await syncDisconnect()
  await _db.close()
  _db = null
}
