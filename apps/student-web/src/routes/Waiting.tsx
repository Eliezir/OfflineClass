import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '../lib/api'
import { clearToken, loadToken } from '../lib/session'
import { connectStudentWs, type WsStatus } from '../lib/ws'

export default function WaitingRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting')

  // Read identity. If the token is missing, send them back to /.
  const meQuery = useQuery({
    queryKey: ['session', 'me'],
    queryFn: api.me,
    retry: false
  })

  useEffect(() => {
    if (!loadToken()) navigate('/', { replace: true })
  }, [navigate])

  useEffect(() => {
    if (meQuery.error) {
      const status = (meQuery.error as Error & { status?: number }).status
      if (status === 401) {
        clearToken()
        navigate('/', { replace: true })
      }
    }
  }, [meQuery.error, navigate])

  // Move to /test as soon as the server says the session is running.
  useEffect(() => {
    if (meQuery.data?.status === 'running' && !meQuery.data.submittedAt) {
      navigate('/test', { replace: true })
    }
    if (meQuery.data?.status === 'ended' || meQuery.data?.submittedAt) {
      navigate('/done', { replace: true })
    }
  }, [meQuery.data, navigate])

  // WS subscription: every event invalidates `me` so the navigate effect
  // above takes over.
  useEffect(() => {
    const token = loadToken()
    if (!token) return
    const conn = connectStudentWs({
      token,
      onStatus: setWsStatus,
      onEvent: () => qc.invalidateQueries({ queryKey: ['session', 'me'] })
    })
    return () => conn.close()
  }, [qc])

  // Heartbeat every 10s while waiting.
  useEffect(() => {
    const interval = setInterval(() => {
      void api.heartbeat().catch(() => {})
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className="bg-background flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Aguarde o professor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground text-sm">
            {meQuery.data
              ? `${meQuery.data.studentName} · matrícula ${meQuery.data.studentMatricula}`
              : 'Carregando…'}
          </p>
          <div className="border-border bg-muted/40 mx-auto h-1 w-32 overflow-hidden rounded-full">
            <div className="bg-primary h-full w-1/3 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            Conexão: {wsStatus}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
