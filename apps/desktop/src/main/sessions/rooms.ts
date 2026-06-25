import { eq } from 'drizzle-orm'
import { groupMembers, groups, examSessions } from '../db/schema'
import type { WSContext } from 'hono/ws'
import type { WsServerEvent } from '@offlineclass/shared'

interface Subscription {
  ws: WSContext
  role: 'teacher' | 'student'
  sessionId: string
  studentId?: string
  groupId?: string
}

// In-memory registry of live WS subscriptions, keyed by the WSContext
// instance for O(1) removal on socket close. One Rooms per app — created
// at boot and shared between IPC handlers (broadcasting after writes) and
// the Hono server (subscribing new sockets on /api/ws).
export class Rooms {
  private subs = new Map<WSContext, Subscription>()

  addTeacher(sessionId: string, ws: WSContext): void {
    this.subs.set(ws, { ws, role: 'teacher', sessionId })
  }

  addStudent(sessionId: string, studentId: string, groupId: string | null, ws: WSContext): void {
    this.subs.set(ws, { ws, role: 'student', sessionId, studentId, groupId: groupId || undefined })
  }

  updateStudentGroup(studentId: string, groupId: string | null): void {
    for (const sub of this.subs.values()) {
      if (sub.role === 'student' && sub.studentId === studentId) {
        sub.groupId = groupId || undefined
      }
    }
  }

  updateAllStudentGroupsForSession(db: any, sessionId: string): void {
    const memberRows = db
      .select({
        studentId: groupMembers.studentId,
        groupId: groupMembers.groupId
      })
      .from(groupMembers)
      .innerJoin(groups, eq(groups.id, groupMembers.groupId))
      .where(eq(groups.sessionId, sessionId))
      .all()

    const studentToGroup = new Map<string, string>()
    for (const r of memberRows) {
      studentToGroup.set(r.studentId, r.groupId)
    }

    const sessionRow = db
      .select({ groupMode: examSessions.groupMode })
      .from(examSessions)
      .where(eq(examSessions.id, sessionId))
      .get()
    const groupMode = sessionRow?.groupMode ?? 'disabled'

    for (const sub of this.subs.values()) {
      if (sub.role === 'student' && sub.sessionId === sessionId && sub.studentId) {
        if (groupMode !== 'disabled') {
          sub.groupId = studentToGroup.get(sub.studentId) ?? undefined
        } else {
          sub.groupId = sub.studentId
        }
      }
    }
  }

  broadcastYjsToGroup(sessionId: string, groupId: string, senderWs: WSContext, update: Uint8Array): void {
    for (const sub of this.subs.values()) {
      if (
        sub.role === 'student' &&
        sub.sessionId === sessionId &&
        sub.groupId === groupId &&
        sub.ws !== senderWs
      ) {
        try {
          sub.ws.send(update as any)
        } catch {
          // ignore broken sockets
        }
      }
    }
  }

  remove(ws: WSContext): void {
    this.subs.delete(ws)
  }

  kickStudent(studentId: string): void {
    for (const [ws, sub] of this.subs.entries()) {
      if (sub.role === 'student' && sub.studentId === studentId) {
        try {
          ws.close(4000, 'Kicked by teacher')
        } catch {
          // ignore
        }
        this.subs.delete(ws)
      }
    }
  }

  private emit(predicate: (s: Subscription) => boolean, payload: string): void {
    for (const sub of this.subs.values()) {
      if (!predicate(sub)) continue
      try {
        sub.ws.send(payload)
      } catch {
        // ignore broken sockets; their onClose handlers will clean up
      }
    }
  }

  toTeachers(sessionId: string, event: WsServerEvent): void {
    const json = JSON.stringify(event)
    this.emit((s) => s.role === 'teacher' && s.sessionId === sessionId, json)
  }

  toStudents(sessionId: string, event: WsServerEvent): void {
    const json = JSON.stringify(event)
    this.emit((s) => s.role === 'student' && s.sessionId === sessionId, json)
  }

  toAll(sessionId: string, event: WsServerEvent): void {
    const json = JSON.stringify(event)
    this.emit((s) => s.sessionId === sessionId, json)
  }
}
