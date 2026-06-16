import type { WSContext } from 'hono/ws'
import type { WsServerEvent } from '@offlineclass/shared'

interface Subscription {
  ws: WSContext
  role: 'teacher' | 'student'
  sessionId: string
  studentId?: string
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

  addStudent(sessionId: string, studentId: string, ws: WSContext): void {
    this.subs.set(ws, { ws, role: 'student', sessionId, studentId })
  }

  remove(ws: WSContext): void {
    this.subs.delete(ws)
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
