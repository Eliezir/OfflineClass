import { IPC } from '@shared/ipc/channels'
import { PROVIDERS } from './fixtures'
import type {
  CheckProviderInput,
  CheckProviderResult,
  Credential,
  SaveCredentialInput
} from './types'

/* ────────────────────────────────────────────────────────────────────────
   ai-providers resource — talks to the Electron main process over IPC.

   The connection check and credential persistence run in the main process
   (the Claude Code SDK spawns a native binary and authenticates through the
   user's existing login — no API key). This is desktop-only; there is no web
   fallback. Shapes mirror the IPC contract in `@shared/ipc/provider`.
   ──────────────────────────────────────────────────────────────────────── */

/** Verify a provider is usable locally. Mock is always ready; Claude Code is
    probed in the main process (SDK installed + logged in). */
export function checkProvider({ providerId }: CheckProviderInput): Promise<CheckProviderResult> {
  return window.api.invoke(IPC.PROVIDER.CHECK, { providerId })
}

/** Persist the chosen default provider. The main process stores only the id
    (no secret); we attach the display label from the fixtures here. */
export async function saveCredential({ providerId }: SaveCredentialInput): Promise<Credential> {
  const label = PROVIDERS.find((p) => p.id === providerId)?.label ?? providerId
  const saved = await window.api.invoke(IPC.PROVIDER.SAVE, { providerId })
  return { ...saved, label }
}
