import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm'
import type {
  CodeLanguage,
  JoinInput,
  JoinResult,
  McqOption,
  Question,
  SessionAnswersReview,
  SessionCreateInput,
  SessionDetail,
  SessionLobbyStudent,
  SessionPublic,
  SessionResultSummary,
  SessionStatus,
  SessionSummary,
  StudentAnswerReview,
  StudentAnswerSnapshot,
  StudentExam,
  StudentQuestion,
  StudentSessionState
} from '@offlineclass/shared'

import type { Db } from '../db/client'
import { rowToQuestion } from '../db/questions-map'
import { answers, exams, examSessions, questions, students } from '../db/schema'

export class SessionError extends Error {
  constructor(
    message: string,
    public code:
      | 'NOT_FOUND'
      | 'ALREADY_ACTIVE'
      | 'BAD_STATE'
      | 'EXAM_EMPTY'
      | 'JOIN_CLOSED'
      | 'NO_ACTIVE_SESSION'
  ) {
    super(message)
  }
}

const ACTIVE_STATUSES = ['lobby', 'running'] as const

function rowToLobbyStudent(
  row: typeof students.$inferSelect,
  answeredCount = 0
): SessionLobbyStudent {
  return {
    id: row.id,
    name: row.name,
    matricula: row.matricula,
    joinedAt: row.joinedAt.getTime(),
    lastSeenAt: row.lastSeenAt.getTime(),
    submittedAt: row.submittedAt ? row.submittedAt.getTime() : null,
    answeredCount
  }
}

function loadDetailById(db: Db, sessionId: string): SessionDetail | null {
  const row = db
    .select({
      id: examSessions.id,
      examId: examSessions.examId,
      examTitle: exams.title,
      status: examSessions.status,
      durationMinutes: examSessions.durationMinutes,
      allowLateJoin: examSessions.allowLateJoin,
      createdAt: examSessions.createdAt,
      startedAt: examSessions.startedAt,
      endedAt: examSessions.endedAt
    })
    .from(examSessions)
    .innerJoin(exams, eq(exams.id, examSessions.examId))
    .where(eq(examSessions.id, sessionId))
    .get()
  if (!row) return null
  const countRow = db
    .select({ n: sql<number>`COUNT(*)` })
    .from(questions)
    .where(eq(questions.examId, row.examId))
    .get()
  return {
    id: row.id,
    examId: row.examId,
    examTitle: row.examTitle,
    status: row.status as SessionStatus,
    durationMinutes: row.durationMinutes,
    allowLateJoin: row.allowLateJoin,
    questionsCount: Number(countRow?.n ?? 0),
    students: listLobbyStudents(db, sessionId),
    createdAt: row.createdAt.getTime(),
    startedAt: row.startedAt ? row.startedAt.getTime() : null,
    endedAt: row.endedAt ? row.endedAt.getTime() : null
  }
}

export function createSession(db: Db, ownerId: string, input: SessionCreateInput): SessionDetail {
  // Reject if any session is already active anywhere — keeps /api/session/active
  // unambiguous for students.
  const existing = db
    .select({ id: examSessions.id })
    .from(examSessions)
    .where(inArray(examSessions.status, [...ACTIVE_STATUSES]))
    .get()
  if (existing) {
    throw new SessionError('Já existe uma sessão ativa', 'ALREADY_ACTIVE')
  }

  const exam = db
    .select()
    .from(exams)
    .where(and(eq(exams.id, input.examId), eq(exams.ownerId, ownerId)))
    .get()
  if (!exam) throw new SessionError('Prova não encontrada', 'NOT_FOUND')

  const id = randomUUID()
  db.insert(examSessions)
    .values({
      id,
      examId: input.examId,
      ownerId,
      status: 'lobby',
      durationMinutes: input.durationMinutes,
      allowLateJoin: !!input.allowLateJoin
    })
    .run()
  const detail = loadDetailById(db, id)
  if (!detail) throw new SessionError('Falha ao criar sessão', 'BAD_STATE')
  return detail
}

export function getSession(db: Db, sessionId: string, ownerId: string): SessionDetail {
  const detail = loadDetailById(db, sessionId)
  if (!detail) throw new SessionError('Sessão não encontrada', 'NOT_FOUND')
  // Ownership check — reuse the join row to avoid a separate query.
  const owner = db
    .select({ ownerId: examSessions.ownerId })
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .get()
  if (!owner || owner.ownerId !== ownerId) {
    throw new SessionError('Sessão não encontrada', 'NOT_FOUND')
  }
  return detail
}

export function startSession(db: Db, sessionId: string, ownerId: string): SessionDetail {
  const detail = getSession(db, sessionId, ownerId)
  if (detail.status !== 'lobby') {
    throw new SessionError('Sessão não está no lobby', 'BAD_STATE')
  }
  db.update(examSessions)
    .set({ status: 'running', startedAt: new Date() })
    .where(eq(examSessions.id, sessionId))
    .run()
  return getSession(db, sessionId, ownerId)
}

export function endSession(db: Db, sessionId: string, ownerId: string): SessionDetail {
  const detail = getSession(db, sessionId, ownerId)
  if (detail.status === 'ended') {
    return detail
  }
  db.update(examSessions)
    .set({ status: 'ended', endedAt: new Date() })
    .where(eq(examSessions.id, sessionId))
    .run()
  return getSession(db, sessionId, ownerId)
}

export function listSessionsForOwner(db: Db, ownerId: string): SessionSummary[] {
  const rows = db
    .select({
      id: examSessions.id,
      examId: examSessions.examId,
      examTitle: exams.title,
      status: examSessions.status,
      durationMinutes: examSessions.durationMinutes,
      createdAt: examSessions.createdAt,
      startedAt: examSessions.startedAt,
      endedAt: examSessions.endedAt
    })
    .from(examSessions)
    .innerJoin(exams, eq(exams.id, examSessions.examId))
    .where(eq(examSessions.ownerId, ownerId))
    .orderBy(desc(examSessions.createdAt))
    .all()

  // Student totals via a grouped query + map. (A correlated subquery built from
  // sql`...` loses table qualifiers and silently returns 0.)
  const counts = db
    .select({
      sessionId: students.sessionId,
      total: sql<number>`count(*)`,
      submitted: sql<number>`count(${students.submittedAt})`
    })
    .from(students)
    .groupBy(students.sessionId)
    .all()
  const countBySession = new Map(counts.map((c) => [c.sessionId, c]))

  return rows.map((r) => ({
    id: r.id,
    examId: r.examId,
    examTitle: r.examTitle,
    status: r.status as SessionStatus,
    durationMinutes: r.durationMinutes,
    studentsCount: Number(countBySession.get(r.id)?.total ?? 0),
    submittedCount: Number(countBySession.get(r.id)?.submitted ?? 0),
    createdAt: r.createdAt.getTime(),
    startedAt: r.startedAt ? r.startedAt.getTime() : null,
    endedAt: r.endedAt ? r.endedAt.getTime() : null
  }))
}

/**
 * Recent ended sessions for the teacher Home, each with a 0–10 average grade
 * over its *submitted* students. Grading mirrors {@link loadStudentAnswers}:
 * points-weighted — a student's grade is `(earnedPoints / maxPoints) * 10`.
 */
export function listRecentResultsForOwner(
  db: Db,
  ownerId: string,
  limit = 5
): SessionResultSummary[] {
  const sessionRows = db
    .select({
      id: examSessions.id,
      examId: examSessions.examId,
      examTitle: exams.title,
      endedAt: examSessions.endedAt
    })
    .from(examSessions)
    .innerJoin(exams, eq(exams.id, examSessions.examId))
    .where(and(eq(examSessions.ownerId, ownerId), eq(examSessions.status, 'ended')))
    .orderBy(desc(examSessions.endedAt))
    .limit(limit)
    .all()

  return sessionRows.map((s) => {
    const qs = db
      .select()
      .from(questions)
      .where(eq(questions.examId, s.examId))
      .all()
      .map(rowToQuestion)
    const maxPoints = qs.reduce((acc, q) => acc + q.points, 0)

    const submitted = db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.sessionId, s.id), isNotNull(students.submittedAt)))
      .all()

    let gradeSum = 0
    for (const stu of submitted) {
      const ansRows = db
        .select({ questionId: answers.questionId, value: answers.value, score: answers.score })
        .from(answers)
        .where(eq(answers.studentId, stu.id))
        .all()
      const ansByQid = new Map(ansRows.map((a) => [a.questionId, a]))
      // Points-weighted, mirroring loadStudentAnswers: auto kinds earn full points
      // when correct; manual kinds earn their 0–1 fraction × points.
      let earned = 0
      for (const q of qs) {
        const a = ansByQid.get(q.id) ?? null
        const auto = autoGrade(q, a?.value ?? null)
        earned += auto ? auto.score : (a?.score ?? 0) * q.points
      }
      gradeSum += maxPoints > 0 ? (earned / maxPoints) * 10 : 0
    }

    const studentCount = submitted.length
    const averageScore = studentCount > 0 ? gradeSum / studentCount : 0
    return {
      id: s.id,
      examTitle: s.examTitle,
      studentCount,
      averageScore: Math.round(averageScore * 10) / 10,
      endedAt: s.endedAt ? s.endedAt.getTime() : null
    }
  })
}

export function findActiveSessionForOwner(db: Db, ownerId: string): SessionDetail | null {
  const row = db
    .select({ id: examSessions.id })
    .from(examSessions)
    .where(
      and(eq(examSessions.ownerId, ownerId), inArray(examSessions.status, [...ACTIVE_STATUSES]))
    )
    .orderBy(desc(examSessions.createdAt))
    .get()
  if (!row) return null
  return loadDetailById(db, row.id)
}

export function findActiveSessionPublic(db: Db): SessionPublic | null {
  const row = db
    .select({
      id: examSessions.id,
      status: examSessions.status,
      examTitle: exams.title,
      durationMinutes: examSessions.durationMinutes,
      allowLateJoin: examSessions.allowLateJoin
    })
    .from(examSessions)
    .innerJoin(exams, eq(exams.id, examSessions.examId))
    .where(inArray(examSessions.status, [...ACTIVE_STATUSES]))
    .orderBy(desc(examSessions.createdAt))
    .get()
  if (!row) return null
  return {
    id: row.id,
    status: row.status as SessionStatus,
    examTitle: row.examTitle,
    durationMinutes: row.durationMinutes,
    allowLateJoin: row.allowLateJoin
  }
}

export function joinSession(db: Db, input: JoinInput): JoinResult {
  const active = db
    .select()
    .from(examSessions)
    .where(inArray(examSessions.status, [...ACTIVE_STATUSES]))
    .orderBy(desc(examSessions.createdAt))
    .get()
  if (!active) throw new SessionError('Nenhuma sessão ativa', 'NO_ACTIVE_SESSION')
  if (active.status === 'running' && !active.allowLateJoin) {
    throw new SessionError('Sessão já iniciada', 'JOIN_CLOSED')
  }
  if (active.status === 'ended') {
    throw new SessionError('Sessão encerrada', 'JOIN_CLOSED')
  }

  const sessionId = active.id
  const matricula = input.matricula.trim()
  const name = input.name.trim()
  const now = new Date()
  const token = randomUUID()

  // Upsert by (sessionId, matricula). Re-joining with the same matrícula
  // refreshes the token and last-seen — handles browser refresh and network
  // hiccups; cost is that anyone with the matricula can kick the legit
  // student. Acceptable for the LAN academic threat model.
  const inserted = db
    .insert(students)
    .values({
      id: randomUUID(),
      sessionId,
      name,
      matricula,
      token,
      joinedAt: now,
      lastSeenAt: now
    })
    .onConflictDoUpdate({
      target: [students.sessionId, students.matricula],
      set: { name, token, lastSeenAt: now }
    })
    .returning()
    .get()
  if (!inserted) throw new SessionError('Falha ao entrar', 'BAD_STATE')

  return {
    token: inserted.token,
    studentId: inserted.id,
    sessionId,
    status: active.status as SessionStatus,
    studentName: inserted.name,
    studentMatricula: inserted.matricula
  }
}

export function listLobbyStudents(db: Db, sessionId: string): SessionLobbyStudent[] {
  const rows = db
    .select()
    .from(students)
    .where(eq(students.sessionId, sessionId))
    .orderBy(asc(students.joinedAt))
    .all()

  // Answered-per-student via a grouped query + map. (A correlated subquery built
  // from sql`...` loses table qualifiers and silently returns 0.)
  const answered = db
    .select({ studentId: answers.studentId, n: sql<number>`count(*)` })
    .from(answers)
    .groupBy(answers.studentId)
    .all()
  const answeredByStudent = new Map(answered.map((a) => [a.studentId, Number(a.n)]))

  return rows.map((r) => rowToLobbyStudent(r, answeredByStudent.get(r.id) ?? 0))
}

export function findStudentByToken(
  db: Db,
  token: string
): { id: string; sessionId: string; name: string; matricula: string } | null {
  const row = db.select().from(students).where(eq(students.token, token)).get()
  if (!row) return null
  return { id: row.id, sessionId: row.sessionId, name: row.name, matricula: row.matricula }
}

// -- Student gameplay -----------------------------------------------------

interface ResolvedStudent {
  id: string
  sessionId: string
  name: string
  matricula: string
  submittedAt: Date | null
}

function loadStudentFull(db: Db, studentId: string): ResolvedStudent | null {
  const row = db.select().from(students).where(eq(students.id, studentId)).get()
  if (!row) return null
  return {
    id: row.id,
    sessionId: row.sessionId,
    name: row.name,
    matricula: row.matricula,
    submittedAt: row.submittedAt
  }
}

function questionRowToStudent(row: typeof questions.$inferSelect): StudentQuestion {
  const base = { id: row.id, position: row.position, prompt: row.prompt, image: row.image ?? null }
  const studentOptions = (): { id: string; text: string }[] => {
    const opts = row.optionsJson ? (JSON.parse(row.optionsJson) as McqOption[]) : []
    return opts.map((o) => ({ id: o.id, text: o.text }))
  }
  switch (row.kind) {
    case 'mcq':
      return { kind: 'mcq', ...base, options: studentOptions() }
    case 'multi':
      return { kind: 'multi', ...base, options: studentOptions() }
    case 'truefalse':
      return { kind: 'truefalse', ...base }
    case 'code':
      return {
        kind: 'code',
        ...base,
        language: (row.language ?? 'plaintext') as CodeLanguage,
        starterCode: row.starterCode ?? ''
      }
    case 'essay':
    default:
      return { kind: 'essay', ...base }
  }
}

export function getStudentExam(db: Db, studentId: string): StudentExam {
  const student = loadStudentFull(db, studentId)
  if (!student) throw new SessionError('Aluno não encontrado', 'NOT_FOUND')
  const session = db
    .select({
      examId: examSessions.examId,
      examTitle: exams.title,
      examDescription: exams.description,
      durationMinutes: examSessions.durationMinutes,
      startedAt: examSessions.startedAt,
      status: examSessions.status
    })
    .from(examSessions)
    .innerJoin(exams, eq(exams.id, examSessions.examId))
    .where(eq(examSessions.id, student.sessionId))
    .get()
  if (!session) throw new SessionError('Sessão não encontrada', 'NOT_FOUND')
  if (session.status === 'lobby') {
    throw new SessionError('Sessão ainda não iniciada', 'BAD_STATE')
  }
  const qRows = db
    .select()
    .from(questions)
    .where(eq(questions.examId, session.examId))
    .orderBy(asc(questions.position))
    .all()
  return {
    examTitle: session.examTitle,
    examDescription: session.examDescription,
    durationMinutes: session.durationMinutes,
    startedAt: session.startedAt ? session.startedAt.getTime() : null,
    questions: qRows.map(questionRowToStudent)
  }
}

export function getStudentSessionState(db: Db, studentId: string): StudentSessionState {
  const student = loadStudentFull(db, studentId)
  if (!student) throw new SessionError('Aluno não encontrado', 'NOT_FOUND')
  const session = db
    .select({ status: examSessions.status })
    .from(examSessions)
    .where(eq(examSessions.id, student.sessionId))
    .get()
  if (!session) throw new SessionError('Sessão não encontrada', 'NOT_FOUND')
  const answerRows = db.select().from(answers).where(eq(answers.studentId, studentId)).all()
  const answerSnapshots: StudentAnswerSnapshot[] = answerRows.map((row) => ({
    questionId: row.questionId,
    value: row.value,
    updatedAt: row.updatedAt.getTime()
  }))
  return {
    sessionId: student.sessionId,
    status: session.status as SessionStatus,
    studentId: student.id,
    studentName: student.name,
    studentMatricula: student.matricula,
    submittedAt: student.submittedAt ? student.submittedAt.getTime() : null,
    answers: answerSnapshots
  }
}

export function recordHeartbeat(db: Db, studentId: string): void {
  db.update(students).set({ lastSeenAt: new Date() }).where(eq(students.id, studentId)).run()
}

export function saveAnswer(db: Db, studentId: string, questionId: string, value: string): void {
  const student = loadStudentFull(db, studentId)
  if (!student) throw new SessionError('Aluno não encontrado', 'NOT_FOUND')
  if (student.submittedAt) {
    throw new SessionError('Sessão já finalizada para este aluno', 'BAD_STATE')
  }
  const session = db
    .select({ status: examSessions.status, examId: examSessions.examId })
    .from(examSessions)
    .where(eq(examSessions.id, student.sessionId))
    .get()
  if (!session || session.status !== 'running') {
    throw new SessionError('Sessão não está em andamento', 'BAD_STATE')
  }
  const q = db
    .select({ id: questions.id })
    .from(questions)
    .where(and(eq(questions.id, questionId), eq(questions.examId, session.examId)))
    .get()
  if (!q) throw new SessionError('Questão inválida', 'NOT_FOUND')

  const now = new Date()
  db.insert(answers)
    .values({
      id: randomUUID(),
      studentId,
      questionId,
      value,
      updatedAt: now
    })
    .onConflictDoUpdate({
      target: [answers.studentId, answers.questionId],
      set: { value, updatedAt: now }
    })
    .run()
  db.update(students).set({ lastSeenAt: now }).where(eq(students.id, studentId)).run()
}

export function submitStudent(db: Db, studentId: string): void {
  const student = loadStudentFull(db, studentId)
  if (!student) throw new SessionError('Aluno não encontrado', 'NOT_FOUND')
  if (student.submittedAt) return // idempotent
  const session = db
    .select({ status: examSessions.status })
    .from(examSessions)
    .where(eq(examSessions.id, student.sessionId))
    .get()
  if (!session || session.status === 'ended') {
    throw new SessionError('Sessão já encerrada', 'BAD_STATE')
  }
  const now = new Date()
  db.update(students)
    .set({ submittedAt: now, lastSeenAt: now })
    .where(eq(students.id, studentId))
    .run()
}

export function getStudentSessionId(db: Db, studentId: string): string | null {
  const row = db
    .select({ sessionId: students.sessionId })
    .from(students)
    .where(eq(students.id, studentId))
    .get()
  return row?.sessionId ?? null
}

// -- Teacher answer review -----------------------------------------------

/** Auto-grade an objective question. Returns null for manually-graded kinds
    (essay/code). A correct answer is worth the question's full points. */
function autoGrade(
  question: Question,
  value: string | null
): { correct: boolean; score: number } | null {
  switch (question.kind) {
    case 'mcq': {
      const correct =
        value !== null && question.options.find((o) => o.id === value)?.correct === true
      return { correct, score: correct ? question.points : 0 }
    }
    case 'multi': {
      const expected = new Set(question.options.filter((o) => o.correct).map((o) => o.id))
      let picked: string[] = []
      try {
        const parsed = value ? (JSON.parse(value) as unknown) : []
        if (Array.isArray(parsed)) picked = parsed.filter((v): v is string => typeof v === 'string')
      } catch {
        picked = []
      }
      const pickedSet = new Set(picked)
      const correct =
        value !== null &&
        pickedSet.size === expected.size &&
        [...expected].every((id) => pickedSet.has(id))
      return { correct, score: correct ? question.points : 0 }
    }
    case 'truefalse': {
      const correct = value !== null && (value === 'true') === question.answer
      return { correct, score: correct ? question.points : 0 }
    }
    default:
      return null
  }
}

export function loadStudentAnswers(
  db: Db,
  sessionId: string,
  studentId: string,
  ownerId: string
): SessionAnswersReview {
  const sessionRow = db
    .select({
      id: examSessions.id,
      examId: examSessions.examId,
      examTitle: exams.title,
      ownerId: examSessions.ownerId
    })
    .from(examSessions)
    .innerJoin(exams, eq(exams.id, examSessions.examId))
    .where(eq(examSessions.id, sessionId))
    .get()
  if (!sessionRow || sessionRow.ownerId !== ownerId) {
    throw new SessionError('Sessão não encontrada', 'NOT_FOUND')
  }
  const studentRow = db
    .select()
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.sessionId, sessionId)))
    .get()
  if (!studentRow) throw new SessionError('Aluno não encontrado', 'NOT_FOUND')

  const questionRows = db
    .select()
    .from(questions)
    .where(eq(questions.examId, sessionRow.examId))
    .orderBy(asc(questions.position))
    .all()
  const answerRows = db.select().from(answers).where(eq(answers.studentId, studentId)).all()
  const answerByQId = new Map(answerRows.map((a) => [a.questionId, a]))

  const reviews: StudentAnswerReview[] = questionRows.map((row) => {
    const question = rowToQuestion(row)
    const ans = answerByQId.get(row.id) ?? null
    const value = ans?.value ?? null
    // Auto-graded kinds recompute fresh (so editing answers in the builder
    // re-grades on the next read); manual kinds use the teacher's saved score.
    const auto = autoGrade(question, value)
    const correct = auto ? auto.correct : null
    const score = auto ? auto.score : (ans?.score ?? null)
    return { question, value, correct, score }
  })

  // Points-weighted: auto kinds (correct === non-null) already store the earned
  // points; manual kinds store a 0–1 fraction, so they earn fraction × points.
  const totalScore = reviews.reduce(
    (acc, r) => acc + (r.correct !== null ? (r.score ?? 0) : (r.score ?? 0) * r.question.points),
    0
  )
  const maxScore = reviews.reduce((acc, r) => acc + r.question.points, 0)

  return {
    sessionId,
    studentId,
    studentName: studentRow.name,
    studentMatricula: studentRow.matricula,
    examTitle: sessionRow.examTitle,
    submittedAt: studentRow.submittedAt ? studentRow.submittedAt.getTime() : null,
    answers: reviews,
    totalScore,
    maxScore
  }
}

export function gradeAnswer(
  db: Db,
  sessionId: string,
  studentId: string,
  questionId: string,
  score: number,
  ownerId: string
): void {
  // Re-verify the chain teacher → session → student → question to keep this
  // owner-scoped.
  const sessionRow = db
    .select({ examId: examSessions.examId, ownerId: examSessions.ownerId })
    .from(examSessions)
    .where(eq(examSessions.id, sessionId))
    .get()
  if (!sessionRow || sessionRow.ownerId !== ownerId) {
    throw new SessionError('Sessão não encontrada', 'NOT_FOUND')
  }
  const studentRow = db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.id, studentId), eq(students.sessionId, sessionId)))
    .get()
  if (!studentRow) throw new SessionError('Aluno não encontrado', 'NOT_FOUND')
  const questionRow = db
    .select()
    .from(questions)
    .where(and(eq(questions.id, questionId), eq(questions.examId, sessionRow.examId)))
    .get()
  if (!questionRow) throw new SessionError('Questão inválida', 'NOT_FOUND')
  if (questionRow.kind !== 'essay') {
    throw new SessionError('Apenas dissertativas podem ser corrigidas manualmente', 'BAD_STATE')
  }

  const existing = db
    .select({ id: answers.id })
    .from(answers)
    .where(and(eq(answers.studentId, studentId), eq(answers.questionId, questionId)))
    .get()
  const now = new Date()
  if (existing) {
    db.update(answers).set({ score, updatedAt: now }).where(eq(answers.id, existing.id)).run()
  } else {
    // Allow grading even when the student left the field blank — insert a
    // zero-value answer row so the score sticks.
    db.insert(answers)
      .values({
        id: randomUUID(),
        studentId,
        questionId,
        value: '',
        score,
        updatedAt: now
      })
      .run()
  }
}
