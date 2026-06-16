import { z } from 'zod'

// Backend (LAN server) configuration, read from process.env at boot. A local
// `apps/desktop/.env` (gitignored, dev convenience) is loaded by dotenv in the
// main entry before this module evaluates; real environment variables always
// win over `.env`. Every key is optional — the defaults are the offline-first
// happy path, so the app runs with no `.env` at all.
const EnvSchema = z.object({
  // Preferred TCP port for the LAN server. find-free-port scans upward from
  // here, so a busy port just bumps to the next free one.
  OFFLINECLASS_PORT: z.coerce.number().int().positive().max(65535).default(8000),
  // Interface the server binds. 0.0.0.0 exposes it to the classroom Wi-Fi.
  OFFLINECLASS_HOST: z.string().min(1).default('0.0.0.0'),
  // Socket.IO CORS origin. '*' suits the LAN — students load the SPA from the
  // same origin — tighten only if the server is ever exposed beyond the LAN.
  OFFLINECLASS_CORS_ORIGIN: z.string().min(1).default('*')
})

export interface BackendEnv {
  /** Preferred port; the actual bound port may differ (find-free-port). */
  port: number
  host: string
  corsOrigin: string
}

function load(): BackendEnv {
  const parsed = EnvSchema.parse(process.env)
  return {
    port: parsed.OFFLINECLASS_PORT,
    host: parsed.OFFLINECLASS_HOST,
    corsOrigin: parsed.OFFLINECLASS_CORS_ORIGIN
  }
}

/** Parsed, validated backend config. Frozen singleton, evaluated once at boot. */
export const env: BackendEnv = Object.freeze(load())
