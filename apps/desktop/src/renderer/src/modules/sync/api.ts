export interface SyncStatus {
  enabled: boolean
  linked: boolean
  connected: boolean
  state: 'unlinked' | 'idle' | 'syncing' | 'error'
}

export interface LinkAccountInput {
  connectorUrl: string
  email: string
  password: string
  mode: 'register' | 'login'
}

export async function getSyncStatus(): Promise<SyncStatus> {
  return window.api.sync.getStatus() as Promise<SyncStatus>
}

export async function linkAccount(input: LinkAccountInput): Promise<void> {
  const result = (await window.api.sync.linkAccount(input)) as
    | { ok: true }
    | { ok: false; error: string }
  if (!result.ok) throw new Error(result.error)
}

export async function enableSync(): Promise<void> {
  const result = (await window.api.sync.enable()) as { ok: boolean; error?: string }
  if (!result.ok) throw new Error(result.error ?? 'Falha ao ativar sync')
}

export async function disableSync(): Promise<void> {
  await window.api.sync.disable()
}

export async function triggerSync(): Promise<void> {
  const result = (await window.api.sync.trigger()) as { ok: boolean; error?: string }
  if (!result.ok) throw new Error(result.error ?? 'Falha ao sincronizar')
}

export async function unlinkAccount(): Promise<void> {
  await window.api.sync.unlinkAccount()
}
