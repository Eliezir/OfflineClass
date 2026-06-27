import type { Question } from '@offlineclass/shared'

/* The Resultados screen works on a "graded" view-model: each question carries a
   weight (`points`, defined by the teacher when authoring the prova) and an
   `awarded` value (MCQ auto-scored; essays scored by the teacher). The total is
   the sum of awarded over the sum of points. */

export type GradedAnswer = {
  question: Question
  /** Chosen option id (MCQ) or the essay text; null when unanswered. */
  value: string | null
  /** Weight of the question (peso definido na prova). */
  points: number
  /** Points awarded. MCQ: points or 0. Essay: teacher grade, or null = pending. */
  awarded: number | null
  /** Free-text feedback the teacher left on this answer; null when none. */
  feedback: string | null
}

export type StudentResult = {
  studentId: string
  name: string
  matricula: string
  /** Student e-mail for sending grades; null when not provided/filled yet. */
  email: string | null
  /** Teacher's overall remark on this student's exam; null when none. */
  feedback: string | null
  submittedAt: number | null
  joinedAt: number
  leftAt: number | null
  answeredCount: number
  answers: GradedAnswer[]
  total: number
  maxTotal: number
}

export type SessionResults = {
  sessionId: string
  examTitle: string
  examSubject: string | null
  endedAt: number | null
  students: StudentResult[]
}

/** Compact row for the finished-sessions list (screen 1). */
export type EndedSession = {
  id: string
  examTitle: string
  endedAt: number | null
  studentsCount: number
  submittedCount: number
}
