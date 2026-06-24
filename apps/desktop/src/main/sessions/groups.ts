import { randomUUID } from 'node:crypto'
import { and, asc, eq, isNull } from 'drizzle-orm'
import type { GroupMember, GroupPublic } from '@offlineclass/shared'
import type { Db } from '../db/client'
import { groupMembers, groups, students } from '../db/schema'

export class GroupError extends Error {
  code: string
  constructor(message: string, code: string) {
    super(message)
    this.code = code
  }
}

export function createGroup(db: Db, sessionId: string, name: string, studentId?: string): GroupPublic {
  const id = randomUUID()
  const now = new Date()
  db.insert(groups).values({ id, sessionId, name: name.trim(), createdAt: now }).run()
  if (studentId) {
    db.insert(groupMembers).values({ id: randomUUID(), groupId: id, studentId, joinedAt: now }).run()
  }
  return loadGroup(db, id)
}

export function joinGroup(db: Db, groupId: string, studentId: string): void {
  // Remove student from any other group in the same session first.
  const grp = db.select().from(groups).where(eq(groups.id, groupId)).get()
  if (!grp) throw new GroupError('Grupo não encontrado', 'NOT_FOUND')
  leaveAllGroups(db, grp.sessionId, studentId)
  db.insert(groupMembers)
    .values({ id: randomUUID(), groupId, studentId, joinedAt: new Date() })
    .run()
}

export function leaveGroup(db: Db, groupId: string, studentId: string): void {
  db.delete(groupMembers)
    .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.studentId, studentId)))
    .run()
  // Delete empty groups.
  const remaining = db
    .select({ n: groupMembers.id })
    .from(groupMembers)
    .where(eq(groupMembers.groupId, groupId))
    .all()
  if (remaining.length === 0) {
    db.delete(groups).where(eq(groups.id, groupId)).run()
  }
}

function leaveAllGroups(db: Db, sessionId: string, studentId: string): void {
  const memberRows = db
    .select({ groupId: groupMembers.groupId, id: groupMembers.id })
    .from(groupMembers)
    .innerJoin(groups, eq(groups.id, groupMembers.groupId))
    .where(and(eq(groups.sessionId, sessionId), eq(groupMembers.studentId, studentId)))
    .all()
  for (const row of memberRows) {
    leaveGroup(db, row.groupId, studentId)
  }
}

export function listGroups(db: Db, sessionId: string): GroupPublic[] {
  const groupRows = db
    .select()
    .from(groups)
    .where(eq(groups.sessionId, sessionId))
    .orderBy(asc(groups.createdAt))
    .all()

  return groupRows.map((g) => loadGroup(db, g.id))
}

function loadGroup(db: Db, groupId: string): GroupPublic {
  const g = db.select().from(groups).where(eq(groups.id, groupId)).get()
  if (!g) throw new GroupError('Grupo não encontrado', 'NOT_FOUND')

  const memberRows = db
    .select({
      studentId: students.id,
      studentName: students.name,
      studentMatricula: students.matricula,
      joinedAt: groupMembers.joinedAt
    })
    .from(groupMembers)
    .innerJoin(students, eq(students.id, groupMembers.studentId))
    .where(eq(groupMembers.groupId, groupId))
    .orderBy(asc(groupMembers.joinedAt))
    .all()

  const members: GroupMember[] = memberRows.map((m) => ({
    studentId: m.studentId,
    studentName: m.studentName,
    studentMatricula: m.studentMatricula,
    joinedAt: m.joinedAt.getTime()
  }))

  return { id: g.id, name: g.name, members, createdAt: g.createdAt.getTime() }
}

export function shuffleStudentsIntoGroups(db: Db, sessionId: string, maxGroupSizeInput: number | null): void {
  const sessionGroups = db.select({ id: groups.id }).from(groups).where(eq(groups.sessionId, sessionId)).all()
  for (const g of sessionGroups) {
    db.delete(groupMembers).where(eq(groupMembers.groupId, g.id)).run()
  }
  db.delete(groups).where(eq(groups.sessionId, sessionId)).run()

  const activeStudents = db
    .select({ id: students.id })
    .from(students)
    .where(and(eq(students.sessionId, sessionId), isNull(students.leftAt)))
    .all()

  if (activeStudents.length === 0) return

  const shuffled = [...activeStudents]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }

  const size = maxGroupSizeInput && maxGroupSizeInput > 0 ? maxGroupSizeInput : 3

  const now = new Date()
  let groupIndex = 1
  for (let i = 0; i < shuffled.length; i += size) {
    const chunk = shuffled.slice(i, i + size)
    const groupId = randomUUID()
    const groupName = `Grupo ${groupIndex++}`
    
    db.insert(groups).values({
      id: groupId,
      sessionId,
      name: groupName,
      createdAt: now
    }).run()

    for (const student of chunk) {
      db.insert(groupMembers).values({
        id: randomUUID(),
        groupId,
        studentId: student.id,
        joinedAt: now
      }).run()
    }
  }
}

