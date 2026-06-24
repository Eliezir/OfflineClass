import type { SessionAnswersReview, StudentAnswerReview } from '@offlineclass/shared'
import type { GradedAnswer, SessionResults, StudentResult } from './types'

// The backend has no per-question weight yet — each question is worth 1 until
// `questions.points` exists (then this becomes `a.question.points`). Kept in one
// place so the swap is a single line.
const DEFAULT_POINTS = 1

function toGradedAnswer(a: StudentAnswerReview): GradedAnswer {
  const points = DEFAULT_POINTS
  let awarded: number | null
  if (a.question.kind === 'mcq') {
    awarded = a.value === null ? null : a.correct ? points : 0
  } else {
    awarded = a.score // essay: teacher grade or null (pending)
  }
  return { question: a.question, value: a.value, points, awarded }
}

export function tally(answers: GradedAnswer[]): { total: number; maxTotal: number } {
  let total = 0
  let maxTotal = 0
  for (const a of answers) {
    total += a.awarded ?? 0
    maxTotal += a.points
  }
  return { total, maxTotal }
}

export function toStudentResult(review: SessionAnswersReview): StudentResult {
  const answers = review.answers.map(toGradedAnswer)
  const { total, maxTotal } = tally(answers)
  return {
    studentId: review.studentId,
    name: review.studentName,
    matricula: review.studentMatricula,
    avatar: review.studentAvatar,
    submittedAt: review.submittedAt,
    joinedAt: review.joinedAt,
    leftAt: review.leftAt,
    answeredCount: review.answeredCount,
    answers,
    total,
    maxTotal
  }
}

/** Apply pending essay grades (keyed `${studentId}:${questionId}`) over a result
    set and recompute totals — drives instant feedback while grading. */
export function applyGrades(
  results: SessionResults,
  grades: Record<string, number>
): SessionResults {
  const students = results.students.map((student) => {
    const answers = student.answers.map((a) => {
      const key = `${student.studentId}:${a.question.id}`
      if (a.question.kind === 'essay' && key in grades) {
        return { ...a, awarded: grades[key] }
      }
      return a
    })
    return { ...student, answers, ...tally(answers) }
  })
  return { ...results, students }
}

/** Class average (mean of student totals), or null when there are no students. */
export function classAverage(students: StudentResult[]): number | null {
  if (students.length === 0) return null
  return students.reduce((sum, s) => sum + s.total, 0) / students.length
}
