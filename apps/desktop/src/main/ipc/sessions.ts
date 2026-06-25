import { ipcMain, type WebContents } from 'electron'
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
import { listGroups, createGroup, joinGroup, leaveGroup, deleteGroup } from '../sessions/groups'
import { groups, students, groupMembers } from '../db/schema'
import { eq } from 'drizzle-orm'
import { yjsManager } from '../sessions/yjs'
import * as Y from 'yjs'

// Registry: groupId -> Map of WebContents -> its onUpdate listener
const yjsIpcSubscribers = new Map<string, Map<WebContents, (update: Uint8Array, origin: unknown) => void>>()

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

  ipcMain.handle(
    'sessions.deleteGroup',
    async (_event, rawGroupId): Promise<void> => {
      requireTeacherId(db)
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''
      const grp = db.select({ sessionId: groups.sessionId }).from(groups).where(eq(groups.id, groupId)).get()
      if (!grp) throw new Error('Grupo não encontrado')

      // 1. Update rooms for all students in group
      const members = db
        .select({ studentId: groupMembers.studentId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId))
        .all()
      for (const m of members) {
        rooms.updateStudentGroup(m.studentId, null)
      }

      // 2. Delete group from DB
      deleteGroup(db, groupId)

      // 3. Broadcast
      const groupsList = listGroups(db, grp.sessionId)
      rooms.toAll(grp.sessionId, { type: 'group.list', groups: groupsList })
      rooms.toTeachers(grp.sessionId, {
        type: 'session.lobby.update',
        students: listLobbyStudents(db, grp.sessionId)
      })
    }
  )

  ipcMain.handle(
    'sessions.kickStudent',
    async (_event, rawSessionId, rawStudentId): Promise<void> => {
      requireTeacherId(db)
      const sessionId = typeof rawSessionId === 'string' ? rawSessionId : ''
      const studentId = typeof rawStudentId === 'string' ? rawStudentId : ''

      // 1. Remove student from group if any
      const memberRow = db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.studentId, studentId))
        .get()
      if (memberRow) {
        try {
          leaveGroup(db, memberRow.groupId, studentId)
          rooms.updateStudentGroup(studentId, null)
        } catch (err) {
          console.error('Failed to remove student from group on kick:', err)
        }
      }

      // 2. Mark student as left in the DB
      db.update(students)
        .set({ leftAt: new Date() })
        .where(eq(students.id, studentId))
        .run()

      // 3. Force disconnect/kick WebSocket
      rooms.kickStudent(studentId)

      // 4. Broadcast updated list to teacher & students
      const groupsList = listGroups(db, sessionId)
      rooms.toAll(sessionId, { type: 'group.list', groups: groupsList })
      rooms.toTeachers(sessionId, {
        type: 'session.lobby.update',
        students: listLobbyStudents(db, sessionId)
      })
    }
  )

  // ── Yjs IPC transport for teacher monitor ──────────────────────────────
  // Returns the full serialised Y.Doc state so the renderer can initialise its
  // local copy without going through the WebSocket path.
  ipcMain.handle(
    'sessions.getGroupYjsSnapshot',
    (_event, rawGroupId): Uint8Array => {
      requireTeacherId(db)
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''
      const doc = yjsManager.getOrCreateDoc(db, groupId)
      const state = Y.encodeStateAsUpdate(doc)
      console.log(`[IPC] getGroupYjsSnapshot group=${groupId} size=${state.length}`)
      return state
    }
  )

  ipcMain.handle(
    'sessions.subscribeGroupYjs',
    (event, rawGroupId): void => {
      requireTeacherId(db)
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''

      // Get or create the subscriber map for this group
      if (!yjsIpcSubscribers.has(groupId)) {
        yjsIpcSubscribers.set(groupId, new Map())
      }
      const groupSubs = yjsIpcSubscribers.get(groupId)!

      // If already subscribed, remove old listener first to avoid duplicates
      const existingListener = groupSubs.get(event.sender)
      if (existingListener) {
        const doc = yjsManager.getOrCreateDoc(db, groupId)
        doc.off('update', existingListener)
      }

      console.log(`[IPC] Teacher renderer subscribed to Yjs updates for group=${groupId}`)

      // Push updates to this subscriber whenever the server-side doc changes.
      const doc = yjsManager.getOrCreateDoc(db, groupId)
      const onUpdate = (update: Uint8Array, origin: unknown): void => {
        if (origin === 'ipc-push') return // avoid loops
        if (event.sender.isDestroyed()) {
          doc.off('update', onUpdate)
          groupSubs.delete(event.sender)
          return
        }
        try {
          event.sender.send('group.yjs.update', groupId, update)
        } catch {
          doc.off('update', onUpdate)
          groupSubs.delete(event.sender)
        }
      }

      doc.on('update', onUpdate)
      groupSubs.set(event.sender, onUpdate)

      // Cleanup when renderer window closes
      event.sender.once('destroyed', () => {
        doc.off('update', onUpdate)
        groupSubs.delete(event.sender)
        console.log(`[IPC] Teacher renderer unsubscribed (destroyed) from group=${groupId}`)
      })
    }
  )

  ipcMain.handle(
    'sessions.unsubscribeGroupYjs',
    (event, rawGroupId): void => {
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''
      const groupSubs = yjsIpcSubscribers.get(groupId)
      if (groupSubs) {
        const listener = groupSubs.get(event.sender)
        if (listener) {
          const doc = yjsManager.getOrCreateDoc(db, groupId)
          doc.off('update', listener)
          groupSubs.delete(event.sender)
        }
      }
      console.log(`[IPC] Teacher renderer unsubscribed from group=${groupId}`)
    }
  )

  // ── Awareness IPC transport ──────────────────────────────────────────────
  // Renderer subscribes to receive student awareness updates (cursor positions,
  // presence) forwarded from the server via IPC — no WS binary needed.
  ipcMain.handle(
    'sessions.subscribeGroupAwareness',
    (event, rawGroupId): void => {
      requireTeacherId(db)
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''
      rooms.subscribeAwarenessIpc(groupId, event.sender)
      event.sender.once('destroyed', () => rooms.unsubscribeAwarenessIpc(groupId, event.sender))
      console.log(`[IPC] Teacher renderer subscribed to awareness for group=${groupId}`)
    }
  )

  ipcMain.handle(
    'sessions.unsubscribeGroupAwareness',
    (event, rawGroupId): void => {
      const groupId = typeof rawGroupId === 'string' ? rawGroupId : ''
      rooms.unsubscribeAwarenessIpc(groupId, event.sender)
      console.log(`[IPC] Teacher renderer unsubscribed from awareness group=${groupId}`)
    }
  )
}
