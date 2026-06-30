import { existsSync, readFileSync } from 'node:fs'
import { createServer } from 'node:https'
import { join, resolve } from 'node:path'
import { serve, type ServerType } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createNodeWebSocket } from '@hono/node-ws'
import { app as electronApp } from 'electron'
import { Hono, type Context } from 'hono'
import { and, eq } from 'drizzle-orm'

import type { TlsBundle } from '../tls'
import {
  AnswerInput,
  JoinInput,
  UpdateAvatarInput,
  type SessionPublic,
  type StudentExam,
  type StudentSessionState,
  type WsServerEvent
} from '@offlineclass/shared'

import type { Db } from '../db/client'
import { resolveSession } from '../auth/sessions'
import { examSessions, groupMembers, groups } from '../db/schema'
import type { Rooms } from '../sessions/rooms'
import * as Y from 'yjs'
import { yjsManager } from '../sessions/yjs'
import {
  findActiveSessionPublic,
  findStudentByToken,
  getStudentExam,
  getStudentSessionState,
  joinSession,
  leaveSession,
  listLobbyStudents,
  listRosterStudents,
  recordHeartbeat,
  saveAnswer,
  SessionError,
  submitStudent,
  updateStudentAvatar
} from '../sessions/store'
import {
  createGroup,
  joinGroup,
  leaveGroup,
  listGroups,
  deleteGroup,
  renameGroup,
  GroupError
} from '../sessions/groups'

export interface ServerHandle {
  port: number
  stop: () => Promise<void>
}

export interface ServerDeps {
  db: Db
  rooms: Rooms
  tls: TlsBundle
}

function extractBearer(c: Context): string | null {
  const header = c.req.header('authorization')
  if (!header) return null
  const m = /^Bearer\s+(.+)$/i.exec(header)
  return m ? m[1].trim() : null
}

function broadcastLobbyUpdate(db: Db, rooms: Rooms, sessionId: string): void {
  rooms.toTeachers(sessionId, {
    type: 'session.lobby.update',
    students: listLobbyStudents(db, sessionId)
  })
  // Students get a slim roster (name + avatar) so they can see each other in
  // the waiting room without exposing matrículas to peers.
  rooms.toStudents(sessionId, {
    type: 'session.roster.update',
    students: listRosterStudents(db, sessionId)
  })
}

function mapSessionError(c: Context, err: unknown): Response {
  if (err instanceof SessionError) {
    const status =
      err.code === 'NO_ACTIVE_SESSION' || err.code === 'NOT_FOUND'
        ? 404
        : err.code === 'JOIN_CLOSED' || err.code === 'BAD_STATE'
          ? 409
          : err.code === 'ALREADY_ACTIVE'
            ? 409
            : 400
    return c.json({ error: err.code, message: err.message }, status)
  }
  throw err
}

export async function startServer(port: number, deps: ServerDeps): Promise<ServerHandle> {
  const { db, rooms } = deps
  const app = new Hono()
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app })

  function broadcastGroupList(sessionId: string): void {
    const groups = listGroups(db, sessionId)
    rooms.toAll(sessionId, {
      type: 'group.list',
      groups
    } satisfies import('@offlineclass/shared').WsServerEvent)
  }

  function broadcastLobbyAndGroups(sessionId: string): void {
    broadcastLobbyUpdate(db, rooms, sessionId)
    broadcastGroupList(sessionId)
  }

  app.get('/api/health', (c) => c.json({ ok: true }))

  app.get('/api/session/active', (c) => {
    const active = findActiveSessionPublic(db)
    if (!active) return c.json({ error: 'no-active-session' }, 404)
    return c.json(active satisfies SessionPublic)
  })

  app.post('/api/join', async (c) => {
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid-json' }, 400)
    }
    const parsed = JoinInput.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: 'invalid-input', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        400
      )
    }
    try {
      const result = joinSession(db, parsed.data)
      broadcastLobbyAndGroups(result.sessionId)
      return c.json(result)
    } catch (err) {
      return mapSessionError(c, err)
    }
  })

  // ---- Student-authenticated routes -------------------------------------

  app.get('/api/exam/current', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    try {
      const exam: StudentExam = getStudentExam(db, student.id)
      return c.json(exam)
    } catch (err) {
      return mapSessionError(c, err)
    }
  })

  app.get('/api/session/me', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    try {
      const state: StudentSessionState = getStudentSessionState(db, student.id)
      return c.json(state)
    } catch (err) {
      return mapSessionError(c, err)
    }
  })

  app.post('/api/heartbeat', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    recordHeartbeat(db, student.id)
    // Lobby update is cheap-ish; emit so the teacher sees the lastSeenAt
    // tick. Per-student server-side debounce is left for a later pass.
    broadcastLobbyUpdate(db, rooms, student.sessionId)
    return c.json({ ok: true })
  })

  app.post('/api/profile/avatar', async (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid-json' }, 400)
    }
    const parsed = UpdateAvatarInput.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: 'invalid-input', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        400
      )
    }
    const sessionId = updateStudentAvatar(db, token, parsed.data.avatar)
    if (!sessionId) return c.json({ error: 'unauthorized' }, 401)
    broadcastLobbyUpdate(db, rooms, sessionId)
    return c.json({ ok: true })
  })

  app.post('/api/answers', async (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    let body: unknown
    try {
      body = await c.req.json()
    } catch {
      return c.json({ error: 'invalid-json' }, 400)
    }
    const parsed = AnswerInput.safeParse(body)
    if (!parsed.success) {
      return c.json(
        { error: 'invalid-input', message: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        400
      )
    }
    try {
      saveAnswer(db, student.id, parsed.data.questionId, parsed.data.value, student.id)
      broadcastLobbyUpdate(db, rooms, student.sessionId)

      // Also reflect the answer in the group's Y.Doc so the teacher monitor
      // receives it via IPC push — even if the student's Yjs WS path failed.
      const memberRow = db
        .select({ groupId: groupMembers.groupId })
        .from(groupMembers)
        .where(eq(groupMembers.studentId, student.id))
        .get()
      if (memberRow?.groupId) {
        try {
          const doc = yjsManager.getOrCreateDoc(db, memberRow.groupId)
          const payloadStr = JSON.stringify({
            value: parsed.data.value,
            updatedBy: student.id,
            updatedByName: student.name,
            updatedAt: Date.now()
          })
          doc.transact(() => {
            doc.getMap<string>('answers').set(parsed.data.questionId, payloadStr)
          }, 'rest-api')
          console.log(`[/api/answers] Updated yjsManager for group=${memberRow.groupId} q=${parsed.data.questionId}`)
        } catch (err) {
          console.error('[/api/answers] Failed to update yjsManager:', err)
        }
      }

      return c.json({ ok: true })
    } catch (err) {
      return mapSessionError(c, err)
    }
  })

  app.post('/api/submit', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    try {
      const sessionId = student.sessionId
      const submittedStudent = listLobbyStudents(db, sessionId).find((s) => s.id === student.id)
      submitStudent(db, student.id)
      broadcastLobbyAndGroups(sessionId)
      if (submittedStudent) {
        const event: WsServerEvent = {
          type: 'student.submitted',
          student: submittedStudent
        }
        rooms.toTeachers(sessionId, event)
        rooms.toStudents(sessionId, event)
      }
      return c.json({ ok: true })
    } catch (err) {
      return mapSessionError(c, err)
    }
  })

  app.post('/api/leave', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    const sessionId = student.sessionId

    // Capture student info BEFORE leaveSession marks leftAt (after that,
    // listLobbyStudents excludes them so we need to build the payload now).
    const leftStudent = listLobbyStudents(db, sessionId).find((s) => s.id === student.id)

    // Remove from group if any
    const memberRow = db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.studentId, student.id))
      .get()
    if (memberRow) {
      try {
        leaveGroup(db, memberRow.groupId, student.id)
        rooms.updateStudentGroup(student.id, null)
      } catch (err) {
        console.error('Failed to remove student from group on leave:', err)
      }
    }

    leaveSession(db, token)

    // Broadcast updated lobby (student removed) + dedicated leave event.
    broadcastLobbyAndGroups(sessionId)
    if (leftStudent) {
      rooms.toTeachers(sessionId, {
        type: 'student.left',
        student: leftStudent
      } satisfies import('@offlineclass/shared').WsServerEvent)
    }
    return c.json({ ok: true })
  })

  // ---- Groups -----------------------------------------------------------

  app.get('/api/groups', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    return c.json(listGroups(db, student.sessionId))
  })

  app.post('/api/groups', async (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    const session = db
      .select({ status: examSessions.status })
      .from(examSessions)
      .where(eq(examSessions.id, student.sessionId))
      .get()
    if (!session || session.status !== 'lobby') {
      return c.json({ error: 'BAD_STATE', message: 'Grupos estão travados após o início da sessão.' }, 400)
    }

    // Prevent creating a group if the student is already in one
    const existingGroup = db
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .innerJoin(groups, eq(groups.id, groupMembers.groupId))
      .where(and(eq(groups.sessionId, student.sessionId), eq(groupMembers.studentId, student.id)))
      .get()
    if (existingGroup) {
      return c.json({ error: 'ALREADY_IN_GROUP', message: 'Você já está em um grupo. Saia do grupo atual para criar outro.' }, 400)
    }

    let body: { name?: string }
    try { body = await c.req.json() } catch { return c.json({ error: 'invalid-json' }, 400) }
    if (!body.name || body.name.trim().length < 1) {
      return c.json({ error: 'invalid-input', message: 'Nome do grupo obrigatório' }, 400)
    }
    try {
      const group = createGroup(db, student.sessionId, body.name, student.id)
      rooms.updateStudentGroup(student.id, group.id)
      broadcastLobbyAndGroups(student.sessionId)
      return c.json(group)
    } catch (err) {
      if (err instanceof GroupError) return c.json({ error: err.code, message: err.message }, 400)
      throw err
    }

  })

  app.post('/api/groups/:id/join', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    const session = db
      .select({ status: examSessions.status })
      .from(examSessions)
      .where(eq(examSessions.id, student.sessionId))
      .get()
    if (!session || session.status !== 'lobby') {
      return c.json({ error: 'BAD_STATE', message: 'Grupos estão travados após o início da sessão.' }, 400)
    }
    const groupId = c.req.param('id')
    try {
      joinGroup(db, groupId, student.id)
      rooms.updateStudentGroup(student.id, groupId)
      broadcastLobbyAndGroups(student.sessionId)
      return c.json({ ok: true })
    } catch (err) {
      if (err instanceof GroupError) return c.json({ error: err.code, message: err.message }, 400)
      throw err
    }
  })

  app.post('/api/groups/:id/leave', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    const session = db
      .select({ status: examSessions.status })
      .from(examSessions)
      .where(eq(examSessions.id, student.sessionId))
      .get()
    if (!session || session.status !== 'lobby') {
      return c.json({ error: 'BAD_STATE', message: 'Grupos estão travados após o início da sessão.' }, 400)
    }
    const groupId = c.req.param('id')
    try {
      leaveGroup(db, groupId, student.id)
      rooms.updateStudentGroup(student.id, null)
      broadcastLobbyAndGroups(student.sessionId)
      return c.json({ ok: true })
    } catch (err) {
      if (err instanceof GroupError) return c.json({ error: err.code, message: err.message }, 400)
      throw err
    }
  })

  app.patch('/api/groups/:id', async (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    const session = db
      .select({ status: examSessions.status })
      .from(examSessions)
      .where(eq(examSessions.id, student.sessionId))
      .get()
    if (!session || session.status !== 'lobby') {
      return c.json({ error: 'BAD_STATE', message: 'Grupos estão travados após o início da sessão.' }, 400)
    }
    const groupId = c.req.param('id')
    // Verify membership
    const membership = db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.studentId, student.id)))
      .get()
    if (!membership) {
      return c.json({ error: 'FORBIDDEN', message: 'Apenas membros do grupo podem editá-lo.' }, 403)
    }
    let body: { name?: string }
    try { body = await c.req.json() } catch { return c.json({ error: 'invalid-json' }, 400) }
    if (!body.name || body.name.trim().length < 1) {
      return c.json({ error: 'invalid-input', message: 'Nome do grupo obrigatório' }, 400)
    }
    renameGroup(db, groupId, body.name)
    broadcastLobbyAndGroups(student.sessionId)
    return c.json({ ok: true })
  })

  app.delete('/api/groups/:id', (c) => {
    const token = extractBearer(c)
    if (!token) return c.json({ error: 'unauthorized' }, 401)
    const student = findStudentByToken(db, token)
    if (!student) return c.json({ error: 'unauthorized' }, 401)
    const session = db
      .select({ status: examSessions.status })
      .from(examSessions)
      .where(eq(examSessions.id, student.sessionId))
      .get()
    if (!session || session.status !== 'lobby') {
      return c.json({ error: 'BAD_STATE', message: 'Grupos estão travados após o início da sessão.' }, 400)
    }
    const groupId = c.req.param('id')
    // Verify membership
    const membership = db
      .select()
      .from(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.studentId, student.id)))
      .get()
    if (!membership) {
      return c.json({ error: 'FORBIDDEN', message: 'Apenas membros do grupo podem excluí-lo.' }, 403)
    }
    // Get all group members to update their socket room context
    const members = db
      .select({ studentId: groupMembers.studentId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .all()

    deleteGroup(db, groupId)

    // Update socket room mapping for each member
    for (const m of members) {
      rooms.updateStudentGroup(m.studentId, null)
    }

    broadcastLobbyAndGroups(student.sessionId)
    return c.json({ ok: true })
  })


  // ---- WebSocket --------------------------------------------------------
  // MUST come before the static / SPA-fallback handlers below: Hono matches
  // routes in declaration order and `app.get('*')` would otherwise swallow
  // GET /api/ws (returning 404 JSON instead of the WS upgrade response).

  app.get(
    '/api/ws',
    upgradeWebSocket((c) => {
      const role = c.req.query('role')
      const token = c.req.query('token') ?? ''
      const sessionIdParam = c.req.query('sessionId')

      type Auth =
        | { kind: 'teacher'; sessionId: string; groupId?: string | null }
        | { kind: 'student'; studentId: string; studentName: string; sessionId: string; groupId: string | null }
      let auth: Auth | null = null

      if (role === 'teacher' && sessionIdParam) {
        const teacherSession = resolveSession(db, token)
        if (teacherSession) {
          const examSession = db
            .select({ id: examSessions.id })
            .from(examSessions)
            .where(
              and(
                eq(examSessions.id, sessionIdParam),
                eq(examSessions.ownerId, teacherSession.teacherId)
              )
            )
            .get()
          if (examSession) {
            auth = { kind: 'teacher', sessionId: examSession.id }
          }
        }
      } else if (role === 'student') {
        const student = findStudentByToken(db, token)
        if (student) {
          const sessionRow = db
            .select({ groupMode: examSessions.groupMode })
            .from(examSessions)
            .where(eq(examSessions.id, student.sessionId))
            .get()
          const groupMode = sessionRow?.groupMode ?? 'disabled'

          let groupId: string | null = null
          if (groupMode !== 'disabled') {
            const memberRow = db
              .select({ groupId: groupMembers.groupId })
              .from(groupMembers)
              .where(eq(groupMembers.studentId, student.id))
              .get()
            groupId = memberRow?.groupId ?? null
          } else {
            groupId = student.id
          }

          auth = {
            kind: 'student',
            studentId: student.id,
            studentName: student.name,
            sessionId: student.sessionId,
            groupId
          }
        }
      }

      return {
        onOpen: (_event, ws) => {
          if (!auth) {
            ws.close(4001, 'unauthorized')
            return
          }
          if (auth.kind === 'teacher') {
            rooms.addTeacher(auth.sessionId, ws)
            ws.send(
              JSON.stringify({ type: 'connection.ack', role: 'teacher' } satisfies WsServerEvent)
            )
            ws.send(
              JSON.stringify({
                type: 'session.lobby.update',
                students: listLobbyStudents(db, auth.sessionId)
              } satisfies WsServerEvent)
            )
          } else {
            rooms.addStudent(auth.sessionId, auth.studentId, auth.groupId, ws)
            ws.send(
              JSON.stringify({ type: 'connection.ack', role: 'student' } satisfies WsServerEvent)
            )
            ws.send(
              JSON.stringify({
                type: 'session.roster.update',
                students: listRosterStudents(db, auth.sessionId)
              } satisfies WsServerEvent)
            )
            if (auth.groupId) {
              const doc = yjsManager.getOrCreateDoc(db, auth.groupId)
              const state = Y.encodeStateAsUpdate(doc)
              const payload = new Uint8Array(state.length + 1)
              payload[0] = 0 // type 0: Sync Update
              payload.set(state, 1)
              ws.send(payload)
            }
          }
        },
        onMessage: (event, ws) => {
          if (!auth) return
          const sub = rooms.getSubscription(ws)
          const groupId = sub?.groupId ?? (auth.kind === 'student' ? auth.groupId : null)

          if (typeof event.data !== 'string') {
            if (groupId) {
              const data = event.data instanceof Uint8Array
                ? event.data
                : new Uint8Array(event.data as ArrayBuffer)
              const type = data[0]
              const payload = data.subarray(1)

              const studentId = auth.kind === 'student' ? auth.studentId : 'N/A'
              console.log(`[WS Main Server] Received binary update: type=${type}, size=${payload.length} bytes, from role=${auth.kind}, studentId=${studentId}, resolved groupId=${groupId}`)

              if (type === 0) { // Yjs Doc Update
                const doc = yjsManager.getOrCreateDoc(db, groupId)
                try {
                  Y.applyUpdate(doc, payload)
                  console.log(`[WS Main Server] Successfully applied Yjs update to group=${groupId}`)
                } catch (err) {
                  console.error(`[WS Main Server] Failed to apply Yjs update to group=${groupId}:`, err)
                }
                rooms.broadcastYjsToGroup(auth.sessionId, groupId, ws, data)
              } else if (type === 1) { // Awareness Update
                rooms.broadcastYjsToGroup(auth.sessionId, groupId, ws, data)
                // Also forward to teacher renderer via IPC (bypasses WS binary issues)
                rooms.broadcastAwarenessIpc(groupId, payload)
              }
            } else {
              console.warn(`[WS Main Server] Ignored binary update from role=${auth.kind} because groupId could not be resolved. (subFound=${!!sub})`)
            }
          } else {
            // Text frame from client
            try {
              const msg = JSON.parse(event.data.toString())
              console.log(`[WS Main Server] Received text message:`, msg)
              if (msg.type === 'watch-group' && auth.kind === 'teacher') {
                auth.groupId = msg.groupId
                rooms.watchGroup(auth.sessionId, msg.groupId, ws)

                console.log(`[WS Main Server] Teacher is now watching group=${msg.groupId}. Sending initial document state...`)

                // Send the initial document state for the group to the teacher
                const doc = yjsManager.getOrCreateDoc(db, msg.groupId)
                const state = Y.encodeStateAsUpdate(doc)
                const payload = new Uint8Array(state.length + 1)
                payload[0] = 0 // type 0: Sync Update
                payload.set(state, 1)
                ws.send(payload)
                console.log(`[WS Main Server] Initial document state sent to teacher for group=${msg.groupId}. State size=${state.length} bytes`)
              } else if (msg.type === 'group.submit.request' && auth.kind === 'student' && groupId) {
                rooms.handleGroupSubmitRequest(db, groupId, auth.studentId, auth.studentName)
              } else if (msg.type === 'group.submit.confirmResponse' && auth.kind === 'student' && groupId) {
                rooms.handleGroupSubmitResponse(db, groupId, auth.studentId, auth.studentName, msg.confirm)
              }
            } catch (err) {
              console.error('[WS Main Server] Failed to parse text message:', err)
            }
          }
        },
        onClose: (_event, ws) => {
          rooms.remove(ws)
        }
      }
    })
  )

  // ---- Static SPA --------------------------------------------------------
  // Serves apps/student-web/out/renderer on every non-API path so a student
  // scanning the QR loads the SPA from the same origin as the API (no CORS).
  // Declared AFTER the /api/* routes and /api/ws so wildcards don't intercept
  // them. In dev the path resolves to the electron-vite renderer output; in
  // packaged builds electron-builder bundles it via extraResources.
  const studentWebRoot = resolve(electronApp.getAppPath(), '../student-web/out/renderer')
  app.use('*', serveStatic({ root: studentWebRoot }))

  // SPA fallback: unmatched non-API GET serves index.html so client-side
  // routing works on hard refresh / direct URL load.
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'not-found' }, 404)
    const indexPath = join(studentWebRoot, 'index.html')
    if (!existsSync(indexPath)) {
      return c.text(
        'student-web bundle not built yet — run `pnpm --prefix apps/student-web run build`',
        503
      )
    }
    return c.html(readFileSync(indexPath, 'utf-8'))
  })

  const server = await new Promise<ServerType>((resolve) => {
    const s = serve(
      {
        fetch: app.fetch,
        port,
        hostname: '0.0.0.0',
        createServer,
        serverOptions: { key: deps.tls.key, cert: deps.tls.cert }
      },
      () => resolve(s)
    )
  })

  injectWebSocket(server)

  return {
    port,
    stop: () =>
      new Promise((resolve, reject) => {
        try {
          yjsManager.flushAll(db)
        } catch (err) {
          console.error('Failed to flush Yjs snapshots on server stop:', err)
        }
        server.close((err) => (err ? reject(err) : resolve()))
      })
  }
}
