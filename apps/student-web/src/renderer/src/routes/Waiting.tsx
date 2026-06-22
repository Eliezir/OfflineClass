import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createApi } from '../lib/api'
import { clearToken, loadToken } from '../lib/session'
import { notify } from '../lib/toast'
import { useServerUrl } from '../lib/serverContext'
import { connectStudentWs, type WsStatus } from '../lib/ws'

export default function WaitingRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { teacherUrl } = useServerUrl()
  const api = createApi(teacherUrl)
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting')

  useEffect(() => {
    if (!teacherUrl) navigate('/', { replace: true })
  }, [teacherUrl, navigate])

  const meQuery = useQuery({
    queryKey: ['session', 'me', teacherUrl],
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

  useEffect(() => {
    if (meQuery.data?.status === 'running' && !meQuery.data.submittedAt) {
      navigate('/test', { replace: true })
    }
    if (meQuery.data?.submittedAt) {
      navigate('/done', { replace: true })
    }
    if (meQuery.data?.status === 'ended' && !meQuery.data.submittedAt) {
      notify.info('O professor encerrou a sessão.')
      navigate('/ended', { replace: true })
    }
  }, [meQuery.data, navigate])

  useEffect(() => {
    const token = loadToken()
    if (!token) return
    const conn = connectStudentWs({
      token,
      baseUrl: teacherUrl,
      onStatus: setWsStatus,
      onEvent: () => qc.invalidateQueries({ queryKey: ['session', 'me', teacherUrl] })
    })
    return () => conn.close()
  }, [qc, teacherUrl])

  useEffect(() => {
    const interval = setInterval(() => {
      void api.heartbeat().catch(() => {})
    }, 10_000)
    return () => clearInterval(interval)
  }, [api])

  const handleLeave = (): void => {
    clearToken()
    navigate('/', { replace: true })
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>Aguardando o professor</CardTitle>
          <CardDescription>
            {meQuery.data
              ? `Você está na sala como ${meQuery.data.studentName}`
              : 'Carregando…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            {meQuery.data
              ? `Matrícula: ${meQuery.data.studentMatricula}`
              : 'Obtendo informações da sessão…'}
          </p>
          <div className="border-border bg-muted/40 mx-auto h-1 w-40 overflow-hidden rounded-full">
            <div className="bg-primary h-full w-1/3 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            Conexão: {wsStatus}
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={handleLeave}
          >
            <LogOut className="size-3.5" />
            Sair da sala
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
