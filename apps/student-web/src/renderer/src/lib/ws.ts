import { WsServerEvent } from '@offlineclass/shared'

export type WsStatus = 'connecting' | 'open' | 'closed'

interface ConnectOptions {
  token: string
  baseUrl: string | null
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

  const buildUrl = (): string => {
    const token = encodeURIComponent(opts.token)
    if (opts.baseUrl) {
      // Standalone Electron: absolute WebSocket URL to teacher server.
      const wsProto = opts.baseUrl.startsWith('https:') ? 'wss:' : 'ws:'
      const host = opts.baseUrl.replace(/^https?:\/\//, '')
      return `${wsProto}//${host}/api/ws?role=student&token=${token}`
    }
    // Browser (served by teacher): same-origin WebSocket.
    const proto = location.protocol === 'https:' ? 'wss:' : 'ws:'
    return `${proto}//${location.host}/api/ws?role=student&token=${token}`
  }

  const open = (): void => {
    opts.onStatus?.('connecting')
    const ws = new WebSocket(buildUrl())
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
