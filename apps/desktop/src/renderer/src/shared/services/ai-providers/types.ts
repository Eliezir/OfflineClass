/** AI providers the app can talk to. `mock` needs nothing and is the default
    until the user opts into the real one (see closed decision §5).

    `claude-code` runs through the local Claude Code SDK, so it authenticates
    with the user's existing Claude Code login — there is no API key to enter. */
export type ProviderId = 'mock' | 'claude-code'

export type Provider = {
  id: ProviderId
  label: string
  description: string
  /** Whether picking this provider needs a local availability check before the
      user can continue (Claude Code must be installed and logged in). */
  requiresCheck: boolean
}

/** The provider the user settled on. The real contract returns no secret —
    Claude Code holds its own credentials — so the mock mirrors that shape. */
export type Credential = {
  providerId: ProviderId
  label: string
  isDefault: boolean
}

export type CheckProviderInput = {
  providerId: ProviderId
}

export type CheckProviderResult = { ok: true; model: string } | { ok: false; message: string }

export type SaveCredentialInput = {
  providerId: ProviderId
}
