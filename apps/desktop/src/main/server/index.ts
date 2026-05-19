import { serve, type ServerType } from '@hono/node-server'
import { createNodeWebSocket } from '@hono/node-ws'
import { Hono } from 'hono'
import { and, eq } from 'drizzle-orm'
import { JoinInput, type SessionPublic, type WsServerEvent } from '@offlineclass/shared'

import type { Db } from '../db/client'
import { resolveSession } from '../auth/sessions'
import { examSessions } from '../db/schema'
import type { Rooms } from '../sessions/rooms'
import {
  findActiveSessionPublic,
  findStudentByToken,
  joinSession,
  listLobbyStudents,
  SessionError
} from '../sessions/store'

export interface ServerHandle {
  port: number
  stop: () => Promise<void>
}

export interface ServerDeps {
  db: Db
  rooms: Rooms
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
      rooms.toTeachers(result.sessionId, {
        type: 'session.lobby.update',
        students: listLobbyStudents(db, result.sessionId)
      })
      return c.json(result)
    } catch (err) {
      if (err instanceof SessionError) {
        const status = err.code === 'NO_ACTIVE_SESSION' ? 404 : 409
        return c.json({ error: err.code, message: err.message }, status)
      }
      throw err
    }
  })

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

  const server = await new Promise<ServerType>((resolve) => {
    const s = serve(
      {
        fetch: app.fetch,
        port,
        hostname: '0.0.0.0'
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
