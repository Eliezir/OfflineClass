import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm'
import type {
  JoinInput,
  JoinResult,
  McqOption,
  SessionCreateInput,
  SessionDetail,
  SessionLobbyStudent,
  SessionPublic,
  SessionStatus,
  StudentAnswerSnapshot,
  StudentExam,
  StudentQuestion,
  StudentSessionState
} from '@offlineclass/shared'

import type { Db } from '../db/client'
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

export function createSession(
  db: Db,
  ownerId: string,
  input: SessionCreateInput
): SessionDetail {
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

export function findActiveSessionForOwner(db: Db, ownerId: string): SessionDetail | null {
  const row = db
    .select({ id: examSessions.id })
    .from(examSessions)
    .where(
      and(
        eq(examSessions.ownerId, ownerId),
        inArray(examSessions.status, [...ACTIVE_STATUSES])
      )
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
    .select({
      id: students.id,
      sessionId: students.sessionId,
      name: students.name,
      matricula: students.matricula,
      token: students.token,
      joinedAt: students.joinedAt,
      lastSeenAt: students.lastSeenAt,
      submittedAt: students.submittedAt,
      answeredCount: sql<number>`(
        SELECT COUNT(*) FROM ${answers} WHERE ${answers.studentId} = ${students.id}
      )`
    })
    .from(students)
    .where(eq(students.sessionId, sessionId))
    .orderBy(asc(students.joinedAt))
    .all()
  return rows.map((r) =>
    rowToLobbyStudent(
      {
        id: r.id,
        sessionId: r.sessionId,
        name: r.name,
        matricula: r.matricula,
        token: r.token,
        joinedAt: r.joinedAt,
        lastSeenAt: r.lastSeenAt,
        submittedAt: r.submittedAt
      },
      Number(r.answeredCount)
    )
  )
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
  if (row.kind === 'mcq') {
    const opts = row.optionsJson ? (JSON.parse(row.optionsJson) as McqOption[]) : []
    return {
      kind: 'mcq',
      id: row.id,
      position: row.position,
      prompt: row.prompt,
      options: opts.map((o) => ({ id: o.id, text: o.text }))
    }
  }
  return { kind: 'essay', id: row.id, position: row.position, prompt: row.prompt }
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
  const answerRows = db
    .select()
    .from(answers)
    .where(eq(answers.studentId, studentId))
    .all()
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
  db.update(students)
    .set({ lastSeenAt: new Date() })
    .where(eq(students.id, studentId))
    .run()
}

export function saveAnswer(
  db: Db,
  studentId: string,
  questionId: string,
  value: string
): void {
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
