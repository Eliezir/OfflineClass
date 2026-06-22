// End all active sessions. Run via: pnpm end-sessions
// Uses Electron-as-Node to avoid NODE_MODULE_VERSION mismatch with better-sqlite3.
import Database from 'better-sqlite3'
import { join } from 'node:path'
import { app } from 'electron'

const db = new Database(join(app.getPath('userData'), 'offlineclass.db'))
const r = db
  .prepare("UPDATE exam_sessions SET status = 'ended', ended_at = ? WHERE status IN ('lobby', 'running')")
  .run(Date.now())

console.log(`${r.changes} sessão(ões) encerrada(s).`)
db.close()
app.exit(0)
