import { spawn, type ChildProcess } from 'child_process'
import { existsSync } from 'fs'
import { get } from 'http'
import { join } from 'path'
import { app } from 'electron'
import type { BackendStatus } from '@shared/ipc/backend'

/* Dev-only backend lifecycle: Electron spawns the Hono API with `tsx watch`
   (keeping hot-reload), waits for /api/health, and drives the splash status.
   Prod packaging (bundling the backend, shipping Prisma engines) is out of
   scope until there's a release pipeline. */

const BACKEND_PORT = 8080
const HEALTH_URL = `http://localhost:${BACKEND_PORT}/api/health`
const HEALTH_TIMEOUT_MS = 30_000
const HEALTH_INTERVAL_MS = 300
const PROBE_TIMEOUT_MS = 2_000

type StatusListener = (status: BackendStatus) => void

/** Resolve the apps/cloud directory relative to the running desktop app. */
function resolveBackendDir(): string {
  const fromEnv = process.env.OFFLINECLASS_BACKEND_DIR
  if (fromEnv) return fromEnv
  // In dev, app.getAppPath() points at apps/desktop; apps/cloud is its sibling.
  return join(app.getAppPath(), '..', 'cloud')
}

/** Locate the tsx CLI, checking the backend's own node_modules then the hoisted workspace root. */
function resolveTsxCli(backendDir: string): string | null {
  const candidates = [
    join(backendDir, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
    // pnpm workspace hoists shared deps to the repo root (apps/cloud → ../../).
    join(backendDir, '..', '..', 'node_modules', 'tsx', 'dist', 'cli.mjs')
  ]
  return candidates.find((p) => existsSync(p)) ?? null
}

/** Single GET /api/health probe — resolves true only on a 200. */
function probeHealth(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = get(HEALTH_URL, (res) => {
      res.resume()
      resolve(res.statusCode === 200)
    })
    req.on('error', () => resolve(false))
    req.setTimeout(PROBE_TIMEOUT_MS, () => {
      req.destroy()
      resolve(false)
    })
  })
}

function messageFrom(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export class BackendService {
  private child: ChildProcess | null = null
  /** True when we attached to a backend someone else started — we must not kill it. */
  private external = false
  private listeners = new Set<StatusListener>()
  private status: BackendStatus = { phase: 'starting' }

  /** The latest known boot status. */
  getStatus(): BackendStatus {
    return this.status
  }

  /** Subscribe to status changes. Fires immediately with the current status. */
  onStatus(listener: StatusListener): () => void {
    this.listeners.add(listener)
    listener(this.status)
    return () => this.listeners.delete(listener)
  }

  private setStatus(status: BackendStatus): void {
    this.status = status
    for (const listener of this.listeners) listener(status)
  }

  /** Start (or attach to) the backend and resolve true once it answers health. */
  async start(): Promise<boolean> {
    this.setStatus({ phase: 'starting' })

    // Attach to an already-running backend (e.g. `pnpm dev:backend` in another
    // terminal) instead of spawning a duplicate that would fail with EADDRINUSE.
    if (await probeHealth()) {
      this.external = true
      this.setStatus({ phase: 'ready' })
      return true
    }

    try {
      this.spawnBackend()
    } catch (err) {
      this.setStatus({ phase: 'error', message: messageFrom(err) })
      return false
    }

    const ready = await this.waitForHealth()
    if (ready) {
      this.setStatus({ phase: 'ready' })
    } else if (this.status.phase !== 'error') {
      // The 'exit' handler may have already set a more specific error.
      this.setStatus({ phase: 'error', message: 'O servidor não respondeu a tempo.' })
    }
    return ready
  }

  /** Kill any running backend and start fresh. Used by the splash "retry". */
  async restart(): Promise<boolean> {
    this.stop()
    return this.start()
  }

  private spawnBackend(): void {
    const backendDir = resolveBackendDir()
    const tsxCli = resolveTsxCli(backendDir)
    if (!tsxCli) {
      throw new Error('Backend não encontrado. Rode `pnpm install` na raiz do projeto.')
    }

    const posix = process.platform !== 'win32'
    const child = spawn(process.execPath, [tsxCli, 'watch', 'src/main.ts'], {
      cwd: backendDir,
      env: {
        ...process.env,
        // Run the bundled Electron binary as a plain Node process for tsx.
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: 'development',
        PORT: String(BACKEND_PORT)
      },
      stdio: 'pipe',
      // Own process group on posix so we can kill tsx *and* the app it forks.
      detached: posix
    })
    this.child = child

    child.stdout?.on('data', (d: Buffer) => process.stdout.write(`[backend] ${d}`))
    child.stderr?.on('data', (d: Buffer) => process.stderr.write(`[backend] ${d}`))
    child.on('exit', (code, signal) => {
      const wasTracked = this.child === child
      this.child = null
      // Unexpected death (we didn't call stop()) — surface it on the splash.
      if (wasTracked && this.status.phase !== 'error') {
        const reason = code != null ? `código ${code}` : `sinal ${signal}`
        this.setStatus({
          phase: 'error',
          message: `O servidor encerrou inesperadamente (${reason}).`
        })
      }
    })
  }

  private waitForHealth(): Promise<boolean> {
    const deadline = Date.now() + HEALTH_TIMEOUT_MS
    return new Promise((resolve) => {
      const tick = async (): Promise<void> => {
        // The child died before becoming healthy — fail fast instead of waiting out the timeout.
        if (!this.child) return resolve(false)
        if (await probeHealth()) return resolve(true)
        if (Date.now() >= deadline) return resolve(false)
        setTimeout(() => void tick(), HEALTH_INTERVAL_MS)
      }
      void tick()
    })
  }

  /** Kill the spawned backend. No-op when we only attached to an external one. */
  stop(): void {
    if (this.external) {
      this.external = false
      return
    }
    const child = this.child
    this.child = null
    if (!child || child.killed || child.pid == null) return
    try {
      if (process.platform !== 'win32') {
        // Negative pid → signal the whole process group (tsx watch + its child).
        process.kill(-child.pid, 'SIGTERM')
      } else {
        child.kill()
      }
    } catch {
      child.kill()
    }
  }
}
