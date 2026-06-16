import type { Server as IoServer } from 'socket.io'
import type { WsServerEvent } from '@offlineclass/shared'

// Socket.IO room names for a session. Each socket joins its role room plus a
// shared session room, so we can target teachers, students, or everyone.
export const teacherRoom = (sessionId: string): string => `teacher:${sessionId}`
export const studentRoom = (sessionId: string): string => `student:${sessionId}`
export const sessionRoom = (sessionId: string): string => `session:${sessionId}`

/** Every real-time message rides this single Socket.IO event name; the payload
    is the shared discriminated union, so clients keep parsing with one Zod
    schema (`WsServerEvent`). */
export const SERVER_EVENT = 'server-event'

// Thin facade over Socket.IO rooms. Created at boot and shared with the IPC
// handlers (which broadcast after DB writes); `attach` wires in the io instance
// once the server is up. Broadcasts before attach are no-ops — no clients yet.
// Socket membership/cleanup is handled by Socket.IO itself (join on connect,
// auto-leave on disconnect), so this class only broadcasts.
export class Rooms {
  private io: IoServer | null = null

  attach(io: IoServer): void {
    this.io = io
  }

  toTeachers(sessionId: string, event: WsServerEvent): void {
    this.io?.to(teacherRoom(sessionId)).emit(SERVER_EVENT, event)
  }

  toStudents(sessionId: string, event: WsServerEvent): void {
    this.io?.to(studentRoom(sessionId)).emit(SERVER_EVENT, event)
  }

  toAll(sessionId: string, event: WsServerEvent): void {
    this.io?.to(sessionRoom(sessionId)).emit(SERVER_EVENT, event)
  }
}
