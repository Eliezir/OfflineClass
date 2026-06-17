import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { SessionDetail } from '@offlineclass/shared'
import { connectTeacherSocket } from '@renderer/shared/realtime/teacher-socket'
import { sessionKeys } from '../queries'

interface LiveSessionManagerProps {
  sessionId: string
}

/** Headless: subscribes the teacher to the session's live room over Socket.IO
    and folds real-time pushes into the active-session query cache. */
export function LiveSessionManager({ sessionId }: LiveSessionManagerProps): null {
  const queryClient = useQueryClient()

  useEffect(() => {
    let closed = false
    let conn: { close: () => void } | null = null

    void (async () => {
      const [token, status] = await Promise.all([
        window.api.auth.getToken(),
        window.api.discovery.getStatus()
      ])
      if (!token || closed) return

      // The teacher connects to its own LAN server over localhost (cert trusted
      // in Electron); scheme + port come from discovery (OFFLINECLASS_TLS / find-free-port).
      const url = `${status.scheme}://localhost:${status.port}`

      conn = connectTeacherSocket({
        url,
        token,
        sessionId,
        onEvent: (message) => {
          if (message.type === 'session.lobby.update') {
            queryClient.setQueryData<SessionDetail | null>(sessionKeys.active(), (oldData) =>
              oldData ? { ...oldData, students: message.students } : null
            )
          } else if (message.type === 'session.started' || message.type === 'session.ended') {
            void queryClient.invalidateQueries({ queryKey: sessionKeys.active() })
          }
        }
      })
    })()

    return () => {
      closed = true
      conn?.close()
    }
  }, [sessionId, queryClient])

  // Headless pipeline component, returns no layout footprint.
  return null
}
