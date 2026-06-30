import { eq } from 'drizzle-orm'
import { groupMembers, groups, examSessions, students } from '../db/schema'
import type { WSContext } from 'hono/ws'
import type { WsServerEvent } from '@offlineclass/shared'
import type { WebContents } from 'electron'
import { submitStudent } from './store'

export interface Subscription {
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
  // groupId -> WebContents subscribed to awareness updates via IPC
  private awarenessIpcSubs = new Map<string, Set<WebContents>>()
  private pendingSubmits = new Map<string, { initiatorId: string; confirmedStudentIds: Set<string> }>()

  getSubscription(ws: WSContext): Subscription | undefined {
    return this.subs.get(ws)
  }

  addTeacher(sessionId: string, ws: WSContext): void {
    this.subs.set(ws, { ws, role: 'teacher', sessionId })
    console.log(`[Rooms] Registered teacher for session=${sessionId}. Total subs=${this.subs.size}`)
  }

  addStudent(sessionId: string, studentId: string, groupId: string | null, ws: WSContext): void {
    this.subs.set(ws, { ws, role: 'student', sessionId, studentId, groupId: groupId || undefined })
    console.log(`[Rooms] Registered student=${studentId} for session=${sessionId} group=${groupId}. Total subs=${this.subs.size}`)
  }

  watchGroup(_sessionId: string, groupId: string, ws: WSContext): void {
    const sub = this.subs.get(ws)
    if (sub && sub.role === 'teacher') {
      sub.groupId = groupId
      console.log(`[Rooms] Teacher registered to watch group=${groupId}`)
    } else {
      console.warn(`[Rooms] watchGroup failed. subFound=${!!sub} role=${sub?.role}`)
    }
  }

  updateStudentGroup(studentId: string, groupId: string | null): void {
    console.log(`[Rooms] Updating group for student=${studentId} to group=${groupId}`)
    for (const sub of this.subs.values()) {
      if (sub.role === 'student' && sub.studentId === studentId) {
        const oldGroup = sub.groupId
        sub.groupId = groupId || undefined
        console.log(`[Rooms] Student=${studentId} group updated from=${oldGroup} to=${groupId}`)
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
    let sentCount = 0
    let totalMatchedGroup = 0
    for (const sub of this.subs.values()) {
      if (sub.sessionId === sessionId && sub.groupId === groupId) {
        totalMatchedGroup++
        if (sub.ws !== senderWs) {
          try {
            sub.ws.send(update as any)
            sentCount++
          } catch (err) {
            console.error(`[Rooms] Failed to send Yjs update to client (role=${sub.role}):`, err)
          }
        }
      }
    }
    console.log(`[Rooms] broadcastYjsToGroup: session=${sessionId}, group=${groupId}, size=${update.length} bytes. Sent to ${sentCount}/${totalMatchedGroup} clients in group (excluding sender).`)
  }

  remove(ws: WSContext): void {
    this.subs.delete(ws)
  }

  // ── Awareness IPC push ───────────────────────────────────────────────────
  subscribeAwarenessIpc(groupId: string, wc: WebContents): void {
    if (!this.awarenessIpcSubs.has(groupId)) {
      this.awarenessIpcSubs.set(groupId, new Set())
    }
    this.awarenessIpcSubs.get(groupId)!.add(wc)
  }

  unsubscribeAwarenessIpc(groupId: string, wc: WebContents): void {
    this.awarenessIpcSubs.get(groupId)?.delete(wc)
  }

  broadcastAwarenessIpc(groupId: string, encodedAwareness: Uint8Array): void {
    const subs = this.awarenessIpcSubs.get(groupId)
    if (!subs || subs.size === 0) return
    for (const wc of Array.from(subs)) {
      if (wc.isDestroyed()) { subs.delete(wc); continue }
      try {
        wc.send('group.awareness.update', groupId, encodedAwareness)
      } catch {
        subs.delete(wc)
      }
    }
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

  getOnlineGroupMembers(groupId: string): Subscription[] {
    const list: Subscription[] = []
    for (const sub of this.subs.values()) {
      if (sub.role === 'student' && sub.groupId === groupId && sub.studentId) {
        list.push(sub)
      }
    }
    return list
  }

  getOnlineGroupStudentIds(db: any, groupId: string): { id: string; name: string }[] {
    // 1. Get all group members from DB
    const membersDb = db
      .select({
        id: students.id,
        name: students.name,
        lastSeenAt: students.lastSeenAt
      })
      .from(groupMembers)
      .innerJoin(students, eq(students.id, groupMembers.studentId))
      .where(eq(groupMembers.groupId, groupId))
      .all()

    // 2. Check active WS subscriptions
    const activeWsStudentIds = new Set<string>()
    for (const sub of this.subs.values()) {
      if (sub.role === 'student' && sub.studentId) {
        activeWsStudentIds.add(sub.studentId)
      }
    }

    const now = Date.now()
    const list: { id: string; name: string }[] = []

    for (const m of membersDb) {
      const hasWs = activeWsStudentIds.has(m.id)
      const isRecent = m.lastSeenAt && (now - m.lastSeenAt.getTime()) < 20000
      if (hasWs || isRecent) {
        list.push({ id: m.id, name: m.name })
      }
    }
    return list
  }

  sendToStudent(studentId: string, event: any): void {
    const json = JSON.stringify(event)
    for (const sub of this.subs.values()) {
      if (sub.role === 'student' && sub.studentId === studentId) {
        try {
          sub.ws.send(json)
        } catch {
          // ignore
        }
      }
    }
  }

  broadcastToGroup(groupId: string, event: any): void {
    const json = JSON.stringify(event)
    for (const sub of this.subs.values()) {
      if (sub.groupId === groupId) {
        try {
          sub.ws.send(json)
        } catch {
          // ignore
        }
      }
    }
  }

  handleGroupSubmitRequest(db: any, groupId: string, studentId: string, studentName: string): void {
    const onlineStudents = this.getOnlineGroupStudentIds(db, groupId)
    const studentIds = onlineStudents.map((s) => s.id)

    if (studentIds.length <= 1) {
      submitStudent(db, studentId)
      this.broadcastToGroup(groupId, { type: 'group.submit.success' })
      return
    }

    this.pendingSubmits.set(groupId, {
      initiatorId: studentId,
      confirmedStudentIds: new Set([studentId])
    })

    const studentNameMap = new Map(onlineStudents.map((s) => [s.id, s.name]))
    const awaitingIds = studentIds.filter(id => id !== studentId)
    const awaitingNames = awaitingIds.map(id => studentNameMap.get(id) || 'Estudante')

    this.sendToStudent(studentId, {
      type: 'group.submit.waiting',
      awaitingNames
    })

    const initiatorName = studentNameMap.get(studentId) || studentName
    for (const id of awaitingIds) {
      this.sendToStudent(id, {
        type: 'group.submit.confirmPrompt',
        initiatorName
      })
    }
  }

  handleGroupSubmitResponse(db: any, groupId: string, studentId: string, studentName: string, confirm: boolean): void {
    const pending = this.pendingSubmits.get(groupId)
    if (!pending) return

    if (!confirm) {
      this.pendingSubmits.delete(groupId)
      this.broadcastToGroup(groupId, {
        type: 'group.submit.cancelled',
        rejecterName: studentName
      })
      return
    }

    pending.confirmedStudentIds.add(studentId)

    const onlineStudents = this.getOnlineGroupStudentIds(db, groupId)
    const onlineStudentIds = onlineStudents.map((s) => s.id)

    const allConfirmed = onlineStudentIds.every(id => pending.confirmedStudentIds.has(id))

    if (allConfirmed) {
      this.pendingSubmits.delete(groupId)
      submitStudent(db, studentId)
      this.broadcastToGroup(groupId, {
        type: 'group.submit.success'
      })
    } else {
      const awaitingIds = onlineStudentIds.filter(id => !pending.confirmedStudentIds.has(id))
      const studentNameMap = new Map(onlineStudents.map((s) => [s.id, s.name]))
      const awaitingNames = awaitingIds.map(id => studentNameMap.get(id) || 'Estudante')

      this.broadcastToGroup(groupId, {
        type: 'group.submit.waiting',
        awaitingNames
      })
    }
  }
}
