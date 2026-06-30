import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type { EmailSettings, EmailSettingsInput, EmailTestResult } from '@offlineclass/shared'

/* SMTP config for e-mailing grades. Persisted in the local DB (owner-scoped) via
   the `email.*` IPC surface; surfaced here as a TanStack Query + mutations so the
   Settings section and the send dialog share one source of truth. */

export const emailSettingsKeys = {
  all: ['email-settings'] as const
}

export function useEmailSettingsQuery(): UseQueryResult<EmailSettings | null, Error> {
  return useQuery({
    queryKey: emailSettingsKeys.all,
    queryFn: () => window.api.email.getSettings()
  })
}

export function useSaveEmailSettings(): UseMutationResult<
  EmailSettings,
  Error,
  EmailSettingsInput
> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: EmailSettingsInput) => window.api.email.saveSettings(input),
    onSuccess: (settings) => qc.setQueryData(emailSettingsKeys.all, settings)
  })
}

export function useTestEmailSettings(): UseMutationResult<
  EmailTestResult,
  Error,
  EmailSettingsInput
> {
  return useMutation({
    mutationFn: (input: EmailSettingsInput) => window.api.email.test(input)
  })
}
