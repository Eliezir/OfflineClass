import { io, type Socket } from 'socket.io-client'
import { WsServerEvent } from '@offlineclass/shared'

export type RealtimeStatus = 'connecting' | 'open' | 'closed'

interface TeacherSocketOptions {
  /** Base URL of the LAN server, e.g. `https://localhost:8000`
      (port from `window.api.discovery.getStatus()`). */
  url: string
  /** Teacher session token, from `window.api.auth.getToken()`. */
  token: string
  /** The exam session to observe. */
  sessionId: string
  onEvent: (event: WsServerEvent) => void
  onStatus?: (status: RealtimeStatus) => void
}

export interface TeacherSocket {
  close: () => void
}

/** Teacher-side live connection to a session over Socket.IO. Unlike the student
    SPA (served by the LAN server, so same-origin), the teacher renderer is a
    separate origin, so the server `url` is required. Auth — role + token +
    sessionId — travels in the handshake; the server validates the teacher owns
    the session before joining its room. Socket.IO handles reconnection. */
export function connectTeacherSocket(opts: TeacherSocketOptions): TeacherSocket {
  opts.onStatus?.('connecting')

  const socket: Socket = io(opts.url, {
    auth: { role: 'teacher', token: opts.token, sessionId: opts.sessionId }
  })

  socket.on('connect', () => opts.onStatus?.('open'))
  socket.on('disconnect', () => opts.onStatus?.('closed'))
  socket.on('connect_error', () => opts.onStatus?.('closed'))

  socket.on('server-event', (raw: unknown) => {
    const parsed = WsServerEvent.safeParse(raw)
    if (parsed.success) opts.onEvent(parsed.data)
  })

  return {
    close: () => {
      socket.close()
    }
  }
}
