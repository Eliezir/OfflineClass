import { WsServerEvent } from '@offlineclass/shared'

export type WsStatus = 'connecting' | 'open' | 'closed'

interface ConnectOptions {
  url: string
  onEvent: (event: WsServerEvent) => void
  onStatus?: (status: WsStatus) => void
}

export interface WsConnection {
  close: () => void
}

// Single-purpose WS client used by the renderer (teacher) and the student
// SPA. Auto-reconnects with a 1.5s backoff until close() is called. Messages
// are parsed against the WsServerEvent zod schema; payloads that don't match
// are silently dropped.
export function connectWs(opts: ConnectOptions): WsConnection {
  let closed = false
  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const open = (): void => {
    opts.onStatus?.('connecting')
    const ws = new WebSocket(opts.url)
    socket = ws

    ws.onopen = () => opts.onStatus?.('open')
    ws.onmessage = (event) => {
      if (typeof event.data !== 'string') return
      let raw: unknown
      try {
        raw = JSON.parse(event.data)
      } catch {
        return
      }
      const parsed = WsServerEvent.safeParse(raw)
      if (parsed.success) opts.onEvent(parsed.data)
    }
    ws.onclose = () => {
      opts.onStatus?.('closed')
      socket = null
      if (!closed) {
        reconnectTimer = setTimeout(open, 1500)
      }
    }
    // onerror fires before onclose; let onclose drive the reconnect logic.
  }

  open()

  return {
    close: () => {
      closed = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      socket?.close()
    }
  }
}
