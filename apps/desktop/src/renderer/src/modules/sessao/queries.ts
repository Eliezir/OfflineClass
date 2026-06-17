import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type {
  DiscoveryStatus,
  SessionAnswersReview,
  SessionCreateInput,
  SessionDetail,
  SessionResultSummary,
  SessionSummary
} from '@offlineclass/shared'
import {
  createSession,
  endSession,
  getActiveSession,
  getDiscoveryStatus,
  getRecentResults,
  getStudentAnswers,
  listSessions,
  startSession,
  gradeStudentAnswer
} from './api'

export const sessionKeys = {
  all: ['sessions'] as const,
  list: () => [...sessionKeys.all, 'list'] as const,
  active: () => [...sessionKeys.all, 'active'] as const,
  recentResults: () => [...sessionKeys.all, 'recentResults'] as const,
  studentAnswers: (sessionId: string, studentId: string) =>
    [...sessionKeys.all, 'studentAnswers', sessionId, studentId] as const
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

export function useSessionsQuery(): UseQueryResult<SessionSummary[], Error> {
  return useQuery({ queryKey: sessionKeys.list(), queryFn: listSessions })
}

export function useRecentResultsQuery(): UseQueryResult<SessionResultSummary[], Error> {
  return useQuery({ queryKey: sessionKeys.recentResults(), queryFn: getRecentResults })
}

export function useStudentAnswersQuery(
  sessionId: string | undefined,
  studentId: string | null,
  enabled: boolean
): UseQueryResult<SessionAnswersReview, Error> {
  return useQuery({
    queryKey: sessionKeys.studentAnswers(sessionId ?? '', studentId ?? ''),
    queryFn: () => getStudentAnswers(sessionId as string, studentId as string),
    enabled: enabled && !!sessionId && !!studentId,
    // Mirror the dashboard's interim live poll while the drawer is open.
    refetchInterval: LIVE_POLL_MS
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

/**
 * Mutation hook to dynamically submit manual scores for essay questions.
 * Directly re-hydrates the specific student dashboard query cache upon success.
 */
export function useGradeAnswerMutation(
  sessionId: string,
  studentId: string
): UseMutationResult<SessionAnswersReview, Error, { questionId: string; score: number | null }> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ questionId, score }) =>
      gradeStudentAnswer(sessionId, studentId, questionId, score),
    onSuccess: (updatedReview) => {
      // Optimistic cache replacement with the structural payload returned from the SQLite channel
      qc.setQueryData(sessionKeys.studentAnswers(sessionId, studentId), updatedReview)

      // Enforce synchronization across layout tables
      qc.invalidateQueries({ queryKey: sessionKeys.studentAnswers(sessionId, studentId) })
    }
  })
}
