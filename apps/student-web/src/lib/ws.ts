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

export function connectStudentWs(opts: ConnectOptions): WsConnection {
  let closed = false
  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null

  const open = (): void => {
    opts.onStatus?.('connecting')
    // Same host:port as the SPA bundle's origin.
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${proto}//${location.host}/api/ws?role=student&token=${encodeURIComponent(opts.token)}`
    const ws = new WebSocket(url)
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
      if (!closed) reconnectTimer = setTimeout(open, 1500)
    }
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
