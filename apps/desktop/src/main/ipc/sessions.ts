import { ipcMain } from 'electron'
import {
  GradeAnswerInput,
  SessionCreateInput,
  type SessionAnswersReview,
  type SessionDetail,
  type SessionResultSummary,
  type SessionSummary,
  type WsServerEvent,
  type GroupPublic
} from '@offlineclass/shared'
import { getMainWindow } from '../windows'

import { requireTeacherId } from './auth'
import type { Db } from '../db/client'
import {
  createSession,
  endSession,
  findActiveSessionForOwner,
  getSession,
  gradeAnswer,
  listLobbyStudents,
  listRecentResultsForOwner,
  listSessionsForOwner,
  loadStudentAnswers,
  startSession
} from '../sessions/store'
import type { Rooms } from '../sessions/rooms'
import { listGroups, createGroup, joinGroup, leaveGroup } from '../sessions/groups'
import { groups } from '../db/schema'
import { eq } from 'drizzle-orm'

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

  ipcMain.handle('sessions.recentResults', async (): Promise<SessionResultSummary[]> => {
    const ownerId = requireTeacherId(db)
    return listRecentResultsForOwner(db, ownerId)
  })

  ipcMain.handle('sessions.start', async (_event, rawId): Promise<SessionDetail> => {
    const ownerId = requireTeacherId(db)
    const id = typeof rawId === 'string' ? rawId : ''
    const detail = startSession(db, id, ownerId)
    if (detail.groupMode === 'shuffle') {
      rooms.updateAllStudentGroupsForSession(db, id)
      rooms.toAll(id, {
        type: 'group.list',
        groups: listGroups(db, id)
      })
      rooms.toTeachers(id, {
        type: 'session.lobby.update',
        students: listLobbyStudents(db, id)
      })
    }
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

  ipcMain.handle('sessions.print', async (): Promise<void> => {
    const w = getMainWindow()
    if (w) w.webContents.print({ printBackground: true }, () => {})
  })

  ipcMain.handle('sessions.exportPdf', async (): Promise<string | null> => {
    const w = getMainWindow()
    if (!w) return null
    const data = await w.webContents.printToPDF({ printBackground: true, landscape: false })
    return data.toString('base64')
  })

  ipcMain.handle(
    'sessions.gradeAnswer',
    async (_event, rawSessionId, raw): Promise<SessionAnswersReview> => {
      const ownerId = requireTeacherId(db)
      const sessionId = typeof rawSessionId === 'string' ? rawSessionId : ''
      const input = GradeAnswerInput.parse(raw)
      gradeAnswer(db, sessionId, input.studentId, input.questionId, input.score, ownerId)
      return loadStudentAnswers(db, sessionId, input.studentId, ownerId)
    }
  )

  ipcMain.handle(
    'sessions.createGroup',
    async (_event, rawSessionId, rawName, rawStudentId): Promise<GroupPublic> => {
      requireTeacherId(db)
      const sessionId = typeof rawSessionId === 'string' ? rawSessionId : ''
      const name = typeof rawName === 'string' ? rawName : ''
      const studentId = typeof rawStudentId === 'string' ? rawStudentId : ''
      const group = createGroup(db, sessionId, name, studentId)
      if (studentId) {
        rooms.updateStudentGroup(studentId, group.id)
      }
      const groupsList = listGroups(db, sessionId)
      rooms.toAll(sessionId, { type: 'group.list', groups: groupsList })
      rooms.toTeachers(sessionId, {
        type: 'session.lobby.update',
        students: listLobbyStudents(db, sessionId)
      })
      return group
    }
  )

  ipcMain.handle(
    'sessions.joinGroup',
    async (_event, rawGroupId, rawStudentId): Promise<void> => {
      requireTeacherId(db)
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''
      const studentId = typeof rawStudentId === 'string' ? rawStudentId : ''
      const grp = db.select({ sessionId: groups.sessionId }).from(groups).where(eq(groups.id, groupId)).get()
      if (!grp) throw new Error('Grupo não encontrado')
      joinGroup(db, groupId, studentId)
      rooms.updateStudentGroup(studentId, groupId)
      const groupsList = listGroups(db, grp.sessionId)
      rooms.toAll(grp.sessionId, { type: 'group.list', groups: groupsList })
      rooms.toTeachers(grp.sessionId, {
        type: 'session.lobby.update',
        students: listLobbyStudents(db, grp.sessionId)
      })
    }
  )

  ipcMain.handle(
    'sessions.leaveGroup',
    async (_event, rawGroupId, rawStudentId): Promise<void> => {
      requireTeacherId(db)
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''
      const studentId = typeof rawStudentId === 'string' ? rawStudentId : ''
      const grp = db.select({ sessionId: groups.sessionId }).from(groups).where(eq(groups.id, groupId)).get()
      if (!grp) throw new Error('Grupo não encontrado')
      leaveGroup(db, groupId, studentId)
      rooms.updateStudentGroup(studentId, null)
      const groupsList = listGroups(db, grp.sessionId)
      rooms.toAll(grp.sessionId, { type: 'group.list', groups: groupsList })
      rooms.toTeachers(grp.sessionId, {
        type: 'session.lobby.update',
        students: listLobbyStudents(db, grp.sessionId)
      })
    }
  )
}
