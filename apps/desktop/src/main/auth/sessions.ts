import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'

import type { Db } from '../db/client'
import { teacherSessions, teachers } from '../db/schema'

export interface ResolvedSession {
  token: string
  teacherId: string
  teacher: {
    id: string
    email: string
    name: string
  }
}

export function createSession(db: Db, teacherId: string): string {
  const id = randomUUID()
  const token = randomUUID()
  db.insert(teacherSessions).values({ id, teacherId, token }).run()
  return token
}

export function resolveSession(db: Db, token: string): ResolvedSession | null {
  const row = db
    .select({
      token: teacherSessions.token,
      teacherId: teachers.id,
      teacherEmail: teachers.email,
      teacherName: teachers.name
    })
    .from(teacherSessions)
    .innerJoin(teachers, eq(teacherSessions.teacherId, teachers.id))
    .where(eq(teacherSessions.token, token))
    .get()
  if (!row) return null
  return {
    token: row.token,
    teacherId: row.teacherId,
    teacher: { id: row.teacherId, email: row.teacherEmail, name: row.teacherName }
  }
}

export function revokeSession(db: Db, token: string): void {
  db.delete(teacherSessions).where(eq(teacherSessions.token, token)).run()
}
