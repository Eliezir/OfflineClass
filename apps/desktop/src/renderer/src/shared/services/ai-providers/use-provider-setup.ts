import { useEffect, useState } from 'react'
import { PROVIDERS } from './fixtures'
import { useCheckProvider, useSaveCredential } from './queries'
import type { ProviderId } from './types'

export type CheckStatus = 'idle' | 'checking' | 'ok' | 'error'

export type ProviderSetup = {
  providerId: ProviderId
  setProviderId: (id: ProviderId) => void
  status: CheckStatus
  errorMessage: string | null
  /** Re-run the availability probe (used by the "try again" recovery action). */
  check: () => void
  /** Mock can always continue; Claude Code needs a successful probe first. */
  canContinue: boolean
  isSubmitting: boolean
  /** Persist the choice. Resolves `true` on success, `false` if the save failed
      (so the caller can keep the user on the step instead of advancing). */
  submit: () => Promise<boolean>
}

function requiresCheck(id: ProviderId): boolean {
  return PROVIDERS.find((p) => p.id === id)?.requiresCheck ?? false
}

/** Provider selection + availability probe, shared by onboarding and Settings.
    Auto-detects on mount and on every selection (no manual "verify" click). */
export function useProviderSetup(): ProviderSetup {
  const [providerId, setProviderIdState] = useState<ProviderId>('claude-code')

  const checkMutation = useCheckProvider()
  const saveMutation = useSaveCredential()

  // Probe providers that need it; clear any stale result for those that don't.
  // We trigger the mutation (react-query owns the async state) rather than
  // mirroring status into our own state inside an effect.
  const probe = (id: ProviderId): void => {
    if (!requiresCheck(id)) {
      checkMutation.reset()
      return
    }
    checkMutation.mutate({ providerId: id })
  }

  const setProviderId = (id: ProviderId): void => {
    setProviderIdState(id)
    probe(id)
  }

  // Auto-probe the default provider on mount — no manual "verify" click.
  useEffect(() => {
    probe(providerId)
    // Run once on mount; later probes are driven by setProviderId / check.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const check = (): void => probe(providerId)

  // Derive the public status from the mutation + selection so there's a single
  // source of truth. A freshly-selected provider reads as "checking" until the
  // probe settles, so the orb never flashes an idle state.
  const needsCheck = requiresCheck(providerId)
  let status: CheckStatus = 'idle'
  if (needsCheck) {
    if (checkMutation.data) status = checkMutation.data.ok ? 'ok' : 'error'
    else if (checkMutation.isError) status = 'error'
    else status = 'checking'
  }

  const errorMessage =
    needsCheck && checkMutation.data && !checkMutation.data.ok
      ? checkMutation.data.message
      : needsCheck && checkMutation.isError
        ? 'Não foi possível verificar o Claude Code. Tente novamente.'
        : null

  const canContinue = providerId === 'mock' || status === 'ok'

  const submit = async (): Promise<boolean> => {
    try {
      await saveMutation.mutateAsync({ providerId })
      return true
    } catch {
      return false
    }
  }

  return {
    providerId,
    setProviderId,
    status,
    errorMessage,
    check,
    canContinue,
    isSubmitting: saveMutation.isPending,
    submit
  }
}
