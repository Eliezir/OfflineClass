import { IPC } from '@shared/ipc/channels'
import type { IpcOutput } from '@shared/ipc/contract'
import { registerHandler } from '../register'
import { writeDefaultProvider } from '../../services/provider-store'

type CheckResult = IpcOutput<typeof IPC.PROVIDER.CHECK>

/** How long to wait for the Claude Code SDK to spawn and emit its first message
    before declaring the probe failed. Cold starts can be slow; tune if needed. */
const PROBE_TIMEOUT_MS = 15_000

/** Probe the Claude Code SDK: it spawns the bundled native CLI and authenticates
    through the user's existing login (no API key). The first stream message means
    the session initialized — i.e. the binary ran AND auth succeeded — so we
    resolve immediately and tear the subprocess down to avoid spending tokens. */
async function probeClaudeCode(): Promise<CheckResult> {
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), PROBE_TIMEOUT_MS)
  // Lazy import: keeps the ESM-only SDK out of startup and out of any bundle.
  const { query } = await import('@anthropic-ai/claude-agent-sdk')
  const q = query({ prompt: 'ping', options: { abortController: abort, maxTurns: 1 } })

  try {
    for await (const _message of q) {
      return { ok: true, model: 'claude-code (local)' }
    }
    return { ok: false, message: 'Claude Code não respondeu. Verifique a instalação.' }
  } catch (err) {
    if (abort.signal.aborted) {
      return { ok: false, message: 'Tempo esgotado ao verificar o Claude Code.' }
    }
    return { ok: false, message: friendlyMessage(err) }
  } finally {
    clearTimeout(timer)
    try {
      await q.close?.()
    } catch {
      /* best-effort teardown */
    }
  }
}

function friendlyMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  if (/ENOENT|spawn|not found|ENOTDIR/i.test(raw)) {
    return 'Claude Code não está instalado nesta máquina.'
  }
  if (/auth|login|unauthor|credential|401/i.test(raw)) {
    return 'Faça login no Claude Code para continuar.'
  }
  return 'Não foi possível verificar o Claude Code.'
}

export function registerProviderHandlers(): void {
  registerHandler(IPC.PROVIDER.CHECK, ({ providerId }): Promise<CheckResult> | CheckResult => {
    if (providerId === 'mock') return { ok: true, model: 'mock-1' }
    return probeClaudeCode()
  })

  registerHandler(IPC.PROVIDER.SAVE, ({ providerId }) => {
    writeDefaultProvider(providerId)
    return { providerId, isDefault: true }
  })
}
