import {
  useMutation,
  useQuery,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import { gradeAnswer, getSessionResults, listEndedSessions } from './api'
import type { EndedSession, SessionResults } from './types'

export const resultadosKeys = {
  all: ['resultados'] as const,
  endedSessions: () => [...resultadosKeys.all, 'endedSessions'] as const,
  sessionResults: (sessionId: string) => [...resultadosKeys.all, 'session', sessionId] as const
}

export function useEndedSessionsQuery(): UseQueryResult<EndedSession[], Error> {
  return useQuery({
    queryKey: resultadosKeys.endedSessions(),
    queryFn: listEndedSessions
  })
}

export function useSessionResultsQuery(sessionId: string): UseQueryResult<SessionResults, Error> {
  return useQuery({
    queryKey: resultadosKeys.sessionResults(sessionId),
    queryFn: () => getSessionResults(sessionId)
  })
}

type GradeVars = { sessionId: string; studentId: string; questionId: string; score: number }

export function useGradeAnswer(): UseMutationResult<unknown, Error, GradeVars> {
  return useMutation({
    mutationFn: ({ sessionId, studentId, questionId, score }: GradeVars) =>
      gradeAnswer(sessionId, studentId, questionId, score)
  })
}
