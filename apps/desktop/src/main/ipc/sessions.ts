import { ipcMain } from 'electron'
import {
  SessionCreateInput,
  type SessionAnswersReview,
  type SessionDetail,
  type SessionSummary,
  type WsServerEvent
} from '@offlineclass/shared'

import { requireTeacherId } from './auth'
import type { Db } from '../db/client'
import {
  createSession,
  endSession,
  findActiveSessionForOwner,
  getSession,
  listLobbyStudents,
  listSessionsForOwner,
  loadStudentAnswers,
  startSession
} from '../sessions/store'
import type { Rooms } from '../sessions/rooms'

export interface SessionsContext {
  db: Db
  rooms: Rooms
}

export function registerSessionsHandlers(ctx: SessionsContext): void {
  const { db, rooms } = ctx

  ipcMain.handle('sessions.list', async (): Promise<SessionSummary[]> => {
    const ownerId = requireTeacherId(db)
    return listSessionsForOwner(db, ownerId)
  })

  ipcMain.handle('sessions.create', async (_event, raw): Promise<SessionDetail> => {
    const ownerId = requireTeacherId(db)
    const input = SessionCreateInput.parse(raw)
    return createSession(db, ownerId, input)
  })

  ipcMain.handle('sessions.get', async (_event, rawId): Promise<SessionDetail> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    return getSession(db, id, ownerId)
  })

  ipcMain.handle('sessions.active', async (): Promise<SessionDetail | null> => {
    const ownerId = requireTeacherId(db)
    return findActiveSessionForOwner(db, ownerId)
  })

  ipcMain.handle('sessions.start', async (_event, rawId): Promise<SessionDetail> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const detail = startSession(db, id, ownerId)
    const event: WsServerEvent = {
      type: 'session.started',
      startedAt: detail.startedAt ?? Date.now(),
      durationMinutes: detail.durationMinutes
    }
    rooms.toStudents(id, event)
    rooms.toTeachers(id, event)
    return detail
  })

  ipcMain.handle('sessions.end', async (_event, rawId): Promise<SessionDetail> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const detail = endSession(db, id, ownerId)
    rooms.toAll(id, { type: 'session.ended', endedAt: detail.endedAt ?? Date.now() })
    return detail
  })

  // Convenience for the lobby UI: re-emit a snapshot to the teacher's WS so
  // they can resync after a reconnect without an extra round-trip.
  ipcMain.handle('sessions.broadcastLobby', async (_event, rawId): Promise<null> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const detail = getSession(db, id, ownerId)
    rooms.toTeachers(id, {
      type: 'session.lobby.update',
      students: listLobbyStudents(db, detail.id)
    })
    return null
  })

  ipcMain.handle(
    'sessions.studentAnswers',
    async (_event, rawSessionId, rawStudentId): Promise<SessionAnswersReview> => {
      const ownerId = requireTeacherId(db)
      const sessionId = typeof rawSessionId === 'string' ? rawSessionId : ''
      const studentId = typeof rawStudentId === 'string' ? rawStudentId : ''
      return loadStudentAnswers(db, sessionId, studentId, ownerId)
    }
  )
}
