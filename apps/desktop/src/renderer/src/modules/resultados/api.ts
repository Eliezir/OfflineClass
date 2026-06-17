import type { EndedSession, SessionResults } from './types'
import { toStudentResult } from './scoring'

/* Resultados data over the domain IPC bridge. Reuses the same `sessions.*`
   surface the live session uses — just filtered to finished sessions and shaped
   into the graded view-model. */

export async function listEndedSessions(): Promise<EndedSession[]> {
  const sessions = await window.api.sessions.list()
  return sessions
    .filter((s) => s.status === 'ended')
    .map((s) => ({
      id: s.id,
      examTitle: s.examTitle,
      endedAt: s.endedAt,
      studentsCount: s.studentsCount,
      submittedCount: s.submittedCount
    }))
}

export async function getSessionResults(sessionId: string): Promise<SessionResults> {
  const detail = await window.api.sessions.get(sessionId)
  const students = await Promise.all(
    detail.students.map((s) =>
      window.api.sessions.studentAnswers(sessionId, s.id).then(toStudentResult)
    )
  )
  return {
    sessionId: detail.id,
    examTitle: detail.examTitle,
    endedAt: detail.endedAt,
    students
  }
}

export function gradeAnswer(
  sessionId: string,
  studentId: string,
  questionId: string,
  score: number
): Promise<unknown> {
  return window.api.sessions.gradeAnswer(sessionId, { studentId, questionId, score })
}
