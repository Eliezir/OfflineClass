import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { WsServerEvent, type SessionDetail } from '@offlineclass/shared'
import { sessionKeys } from '../queries'

interface LiveSessionManagerProps {
  sessionId: string
}

export function LiveSessionManager({ sessionId }: LiveSessionManagerProps): null {
  const queryClient = useQueryClient()

  useEffect(() => {
    let ws: WebSocket | null = null

    const connectWebSocket = async (): Promise<void> => {
      try {
        const token = await window.api.auth.getToken()
        if (!token) return

        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const wsUrl = baseUrl.replace(/^http/, 'ws')

        ws = new WebSocket(`${wsUrl}/api/ws?role=teacher&token=${token}&sessionId=${sessionId}`)

        ws.onmessage = (event: MessageEvent) => {
          try {
            const rawData = JSON.parse(event.data)
            const parsedEvent = WsServerEvent.safeParse(rawData)

            if (!parsedEvent.success) return

            const message = parsedEvent.data

            // When a real-time push arrives, directly update the active session cache matrix
            if (message.type === 'session.lobby.update') {
              queryClient.setQueryData<SessionDetail | null>(sessionKeys.active(), (oldData) => {
                if (!oldData) return null
                return {
                  ...oldData,
                  students: message.students
                }
              })
            }
          } catch (error) {
            console.error('Failed to process incoming real-time socket frame:', error)
          }
        }

        ws.onclose = () => {
          console.warn('Teacher WebSocket closed. Retrying stream layer...')
        }
      } catch (err) {
        console.error('WebSocket handshake tracking failure:', err)
      }
    }

    connectWebSocket()

    return () => {
      if (ws) ws.close()
    }
  }, [sessionId, queryClient])

  // Headless pipeline component, returns no layout footprint
  return null
}
