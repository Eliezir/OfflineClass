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
  type SessionPublic,
  type StudentExam,
  type StudentSessionState,
  type WsServerEvent
} from '@offlineclass/shared'

import type { Db } from '../db/client'
import { resolveSession } from '../auth/sessions'
import { examSessions } from '../db/schema'
import type { Rooms } from '../sessions/rooms'
import {
  findActiveSessionPublic,
  findStudentByToken,
  getStudentExam,
  getStudentSessionState,
  joinSession,
  listLobbyStudents,
  recordHeartbeat,
  saveAnswer,
  SessionError,
  submitStudent
} from '../sessions/store'

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
      broadcastLobbyUpdate(db, rooms, result.sessionId)
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
      saveAnswer(db, student.id, parsed.data.questionId, parsed.data.value)
      broadcastLobbyUpdate(db, rooms, student.sessionId)
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
      submitStudent(db, student.id)
      broadcastLobbyUpdate(db, rooms, student.sessionId)
      return c.json({ ok: true })
    } catch (err) {
      return mapSessionError(c, err)
    }
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
        | { kind: 'teacher'; sessionId: string }
        | { kind: 'student'; studentId: string; sessionId: string }
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
          if (examSession) auth = { kind: 'teacher', sessionId: examSession.id }
        }
      } else if (role === 'student') {
        const student = findStudentByToken(db, token)
        if (student) {
          auth = { kind: 'student', studentId: student.id, sessionId: student.sessionId }
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
            rooms.addStudent(auth.sessionId, auth.studentId, ws)
            ws.send(
              JSON.stringify({ type: 'connection.ack', role: 'student' } satisfies WsServerEvent)
            )
          }
        },
        onClose: (_event, ws) => {
          rooms.remove(ws)
        }
      }
    })
  )

  // ---- Static SPA --------------------------------------------------------
  // Serves apps/student-web/dist on every non-API path so a phone scanning
  // the QR loads the student SPA from the same origin as the API (no CORS).
  // Declared AFTER the /api/* routes and /api/ws so wildcards don't
  // intercept them. The path is resolved against the Electron app dir;
  // Stage 7 will adjust it for the packaged asar layout.
  const studentWebRoot = resolve(electronApp.getAppPath(), '../student-web/dist')
  app.use('*', serveStatic({ root: studentWebRoot }))

  // SPA fallback: unmatched non-API GET serves index.html so client-side
  // routing works on hard refresh / direct URL load.
  app.get('*', (c) => {
    if (c.req.path.startsWith('/api/')) return c.json({ error: 'not-found' }, 404)
    const indexPath = join(studentWebRoot, 'index.html')
    if (!existsSync(indexPath)) {
      return c.text(
        'student-web bundle not built yet — run `pnpm --filter @offlineclass/student-web build`',
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
        server.close((err) => (err ? reject(err) : resolve()))
      })
  }
}
