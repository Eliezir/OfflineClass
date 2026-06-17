import type {
  DiscoveryStatus,
  SessionAnswersReview,
  SessionCreateInput,
  SessionDetail,
  SessionResultSummary,
  SessionSummary
} from '@offlineclass/shared'

/* Teacher session lifecycle over the domain IPC bridge (window.api.sessions →
   main process). The live roster/progress push (teacher WebSocket) lands in a
   separate branch; here we only do the CRUD + lifecycle transitions. */

export function getActiveSession(): Promise<SessionDetail | null> {
  return window.api.sessions.active()
}

export function listSessions(): Promise<SessionSummary[]> {
  return window.api.sessions.list()
}

export function getRecentResults(): Promise<SessionResultSummary[]> {
  return window.api.sessions.recentResults()
}

export function createSession(input: SessionCreateInput): Promise<SessionDetail> {
  return window.api.sessions.create(input)
}

export function startSession(id: string): Promise<SessionDetail> {
  return window.api.sessions.start(id)
}

export function endSession(id: string): Promise<SessionDetail> {
  return window.api.sessions.end(id)
}

export function getDiscoveryStatus(): Promise<DiscoveryStatus> {
  return window.api.discovery.getStatus()
}

export function getStudentAnswers(
  sessionId: string,
  studentId: string
): Promise<SessionAnswersReview> {
  return window.api.sessions.studentAnswers(sessionId, studentId)
}

export function gradeStudentAnswer(
  sessionId: string,
  studentId: string,
  questionId: string,
  score: number | null
): Promise<SessionAnswersReview> {
  return window.api.sessions.gradeAnswer(sessionId, {
    studentId,
    questionId,
    score: score ?? 0
  })
}
