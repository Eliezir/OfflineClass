import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
  type UseMutationResult,
  type UseQueryResult
} from '@tanstack/react-query'
import type { EmailResultsInput, EmailSendResult, SessionAnswersReview } from '@offlineclass/shared'
import {
  commentAnswer,
  commentStudent,
  emailResults,
  getSessionResults,
  gradeAnswer,
  listEndedSessions,
  setStudentEmail
} from './api'
import { toStudentResult } from './scoring'
import type { EndedSession, SessionResults } from './types'

export const resultadosKeys = {
  all: ['resultados'] as const,
  endedSessions: () => [...resultadosKeys.all, 'endedSessions'] as const,
  sessionResults: (sessionId: string) => [...resultadosKeys.all, 'session', sessionId] as const
}

/** Patch a single student in the cached SessionResults from a fresh review —
    keeps comments/e-mail in view across collapse/expand without a full refetch. */
function patchStudent(qc: QueryClient, sessionId: string, review: SessionAnswersReview): void {
  qc.setQueryData<SessionResults>(resultadosKeys.sessionResults(sessionId), (prev) => {
    if (!prev) return prev
    const updated = toStudentResult(review)
    return {
      ...prev,
      students: prev.students.map((s) => (s.studentId === updated.studentId ? updated : s))
    }
  })
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

type CommentAnswerVars = { studentId: string; questionId: string; comment: string }

export function useCommentAnswer(
  sessionId: string
): UseMutationResult<SessionAnswersReview, Error, CommentAnswerVars> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, questionId, comment }: CommentAnswerVars) =>
      commentAnswer(sessionId, studentId, questionId, comment),
    onSuccess: (review) => patchStudent(qc, sessionId, review)
  })
}

type CommentStudentVars = { studentId: string; comment: string }

export function useCommentStudent(
  sessionId: string
): UseMutationResult<SessionAnswersReview, Error, CommentStudentVars> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, comment }: CommentStudentVars) =>
      commentStudent(sessionId, studentId, comment),
    onSuccess: (review) => patchStudent(qc, sessionId, review)
  })
}

type SetEmailVars = { studentId: string; email: string }

export function useSetStudentEmail(
  sessionId: string
): UseMutationResult<SessionAnswersReview, Error, SetEmailVars> {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ studentId, email }: SetEmailVars) =>
      setStudentEmail(sessionId, studentId, email),
    onSuccess: (review) => patchStudent(qc, sessionId, review)
  })
}

export function useEmailResults(
  sessionId: string
): UseMutationResult<EmailSendResult[], Error, EmailResultsInput> {
  return useMutation({
    mutationFn: (input: EmailResultsInput) => emailResults(sessionId, input)
  })
}
