import { io, type Socket } from 'socket.io-client'
import { WsServerEvent } from '@offlineclass/shared'

export type WsStatus = 'connecting' | 'open' | 'closed'

interface ConnectOptions {
  token: string
  onEvent: (event: WsServerEvent) => void
  onStatus?: (status: WsStatus) => void
}

export interface WsConnection {
  close: () => void
}

/** Live connection to the session over Socket.IO. Same origin as the SPA
    bundle; auth (role + token) travels in the handshake. Socket.IO handles
    reconnection, so callers just react to status + events. The public API is
    unchanged from the previous WebSocket implementation. */
export function connectStudentWs(opts: ConnectOptions): WsConnection {
  opts.onStatus?.('connecting')

  // No URL → connects to the page origin (same host:port as the SPA bundle).
  const socket: Socket = io({
    auth: { role: 'student', token: opts.token }
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
