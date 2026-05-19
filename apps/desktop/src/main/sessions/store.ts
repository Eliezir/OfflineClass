import { randomUUID } from 'node:crypto'
import { and, asc, desc, eq, inArray } from 'drizzle-orm'
import type {
  JoinInput,
  JoinResult,
  SessionCreateInput,
  SessionDetail,
  SessionLobbyStudent,
  SessionPublic,
  SessionStatus
} from '@offlineclass/shared'

import type { Db } from '../db/client'
import { exams, examSessions, students } from '../db/schema'

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

function rowToLobbyStudent(row: typeof students.$inferSelect): SessionLobbyStudent {
  return {
    id: row.id,
    name: row.name,
    matricula: row.matricula,
    joinedAt: row.joinedAt.getTime(),
    lastSeenAt: row.lastSeenAt.getTime(),
    submittedAt: row.submittedAt ? row.submittedAt.getTime() : null
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
  const studentRows = db
    .select()
    .from(students)
    .where(eq(students.sessionId, sessionId))
    .orderBy(asc(students.joinedAt))
    .all()
  return {
    id: row.id,
    examId: row.examId,
    examTitle: row.examTitle,
    status: row.status as SessionStatus,
    durationMinutes: row.durationMinutes,
    allowLateJoin: row.allowLateJoin,
    students: studentRows.map(rowToLobbyStudent),
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
    .select()
    .from(students)
    .where(eq(students.sessionId, sessionId))
    .orderBy(asc(students.joinedAt))
    .all()
  return rows.map(rowToLobbyStudent)
}

export function findStudentByToken(
  db: Db,
  token: string
): { id: string; sessionId: string; name: string; matricula: string } | null {
  const row = db.select().from(students).where(eq(students.token, token)).get()
  if (!row) return null
  return { id: row.id, sessionId: row.sessionId, name: row.name, matricula: row.matricula }
}
