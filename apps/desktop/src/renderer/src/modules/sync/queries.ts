import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getSyncStatus,
  linkAccount,
  enableSync,
  disableSync,
  triggerSync,
  unlinkAccount,
  type LinkAccountInput,
  type SyncStatus
} from './api'

export const syncKeys = {
  status: ['sync', 'status'] as const
}

export function useSyncStatus() {
  return useQuery({
    queryKey: syncKeys.status,
    queryFn: getSyncStatus,
    refetchInterval: 8000
  })
}

export function useLinkAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LinkAccountInput) => linkAccount(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: syncKeys.status })
  })
}

export function useEnableSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: enableSync,
    onSuccess: () => qc.invalidateQueries({ queryKey: syncKeys.status })
  })
}

export function useDisableSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: disableSync,
    onSuccess: () => qc.invalidateQueries({ queryKey: syncKeys.status })
  })
}

export function useTriggerSync() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: triggerSync,
    onSuccess: () => qc.invalidateQueries({ queryKey: syncKeys.status })
  })
}

export function useUnlinkAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unlinkAccount,
    onSuccess: () => {
      qc.setQueryData<SyncStatus>(syncKeys.status, (prev) =>
        prev ? { ...prev, enabled: false, linked: false, connected: false, state: 'unlinked' } : prev
      )
    }
  })
}
