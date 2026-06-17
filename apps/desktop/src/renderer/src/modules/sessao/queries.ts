import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type { DiscoveryStatus, SessionCreateInput, SessionDetail } from '@offlineclass/shared'
import {
  createSession,
  endSession,
  getActiveSession,
  getDiscoveryStatus,
  startSession
} from './api'

export const sessionKeys = {
  all: ['sessions'] as const,
  active: () => [...sessionKeys.all, 'active'] as const
}

// Interim poll so new joins / answer progress surface while a session is live.
// The teacher WebSocket (separate branch) replaces this with real-time pushes.
const LIVE_POLL_MS = 4000

export function useActiveSessionQuery(): UseQueryResult<SessionDetail | null, Error> {
  return useQuery({
    queryKey: sessionKeys.active(),
    queryFn: getActiveSession,
    refetchInterval: (query) => {
      const status = query.state.data?.status
      return status === 'lobby' || status === 'running' ? LIVE_POLL_MS : false
    }
  })
}

export function useDiscoveryQuery(enabled: boolean): UseQueryResult<DiscoveryStatus, Error> {
  return useQuery({
    queryKey: ['discovery', 'status'],
    queryFn: getDiscoveryStatus,
    enabled,
    staleTime: 5 * 60_000
  })
}

function useSetActive(): (detail: SessionDetail | null) => void {
  const qc = useQueryClient()
  return (detail) => qc.setQueryData(sessionKeys.active(), detail)
}

export function useCreateSession(): UseMutationResult<SessionDetail, Error, SessionCreateInput> {
  const setActive = useSetActive()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createSession,
    onSuccess: (detail) => setActive(detail),
    // A failed create (e.g. another session already active) — resync truth.
    onError: () => void qc.invalidateQueries({ queryKey: sessionKeys.active() })
  })
}

export function useStartSession(): UseMutationResult<SessionDetail, Error, string> {
  const setActive = useSetActive()
  return useMutation({ mutationFn: startSession, onSuccess: (detail) => setActive(detail) })
}

export function useEndSession(): UseMutationResult<SessionDetail, Error, string> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: endSession,
    // The session is no longer active — drop it so `active()` reads as null.
    onSuccess: () => qc.setQueryData<SessionDetail | null>(sessionKeys.active(), null)
  })
}
