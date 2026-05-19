import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import type { WsServerEvent } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { api } from '../../lib/api'
import { connectWs, type WsStatus } from '../../lib/ws'

function statusLabel(status: string): string {
  if (status === 'lobby') return 'No lobby'
  if (status === 'running') return 'Em andamento'
  return 'Encerrada'
}

function statusTone(status: string): string {
  if (status === 'running') return 'bg-green-500/15 text-green-700 dark:text-green-300'
  if (status === 'ended') return 'bg-muted text-muted-foreground'
  return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
}

export default function LobbyRoute(): React.JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting')

  const sessionQuery = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => api.sessions.get(id),
    enabled: !!id
  })

  const discoveryQuery = useQuery({
    queryKey: ['discovery', 'status'],
    queryFn: api.discovery.getStatus
  })

  // Subscribe to the teacher-side WS using loopback. Bind only when we have
  // both the session id and a confirmed token from main; tear down on
  // unmount or when the session id changes.
  useEffect(() => {
    if (!id || !discoveryQuery.data) return
    let cancelled = false
    let conn: { close: () => void } | null = null

    void (async () => {
      const token = await window.api.auth.getToken()
      if (!token || cancelled) return
      const port = discoveryQuery.data.port
      const url = `ws://127.0.0.1:${port}/api/ws?role=teacher&sessionId=${encodeURIComponent(id)}&token=${encodeURIComponent(token)}`
      conn = connectWs({
        url,
        onStatus: setWsStatus,
        onEvent: (event: WsServerEvent) => {
          // Whatever the event, the cheapest way to keep the UI honest is
          // to refetch the session detail — server is the source of truth.
          if (
            event.type === 'session.lobby.update' ||
            event.type === 'session.started' ||
            event.type === 'session.ended'
          ) {
            qc.invalidateQueries({ queryKey: ['sessions', id] })
            qc.invalidateQueries({ queryKey: ['sessions', 'active'] })
          }
        }
      })
    })()

    return () => {
      cancelled = true
      conn?.close()
    }
  }, [id, discoveryQuery.data?.port, qc])

  const startMutation = useMutation({
    mutationFn: () => api.sessions.start(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', id] })
      qc.invalidateQueries({ queryKey: ['sessions', 'active'] })
    }
  })

  const endMutation = useMutation({
    mutationFn: () => api.sessions.end(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sessions', id] })
      qc.invalidateQueries({ queryKey: ['sessions', 'active'] })
    }
  })

  if (sessionQuery.error) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <p className="text-destructive">Erro ao carregar sessão: {String(sessionQuery.error)}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/">Voltar</Link>
        </Button>
      </main>
    )
  }

  if (sessionQuery.isPending || !sessionQuery.data) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <p className="text-muted-foreground text-sm">Carregando…</p>
      </main>
    )
  }

  const session = sessionQuery.data
  const discovery = discoveryQuery.data

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            <Link to="/">← Início</Link>
          </p>
          <h1 className="text-3xl font-semibold">{session.examTitle}</h1>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <span
              className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusTone(session.status))}
            >
              {statusLabel(session.status)}
            </span>
            <span>· {session.durationMinutes} min</span>
            <span>·</span>
            <span>WS: {wsStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {session.status === 'lobby' && (
            <Button
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending || session.students.length === 0}
            >
              {startMutation.isPending ? 'Iniciando…' : 'Iniciar prova'}
            </Button>
          )}
          {session.status === 'running' && (
            <Button
              variant="destructive"
              onClick={() => {
                if (confirm('Encerrar a sessão agora?')) endMutation.mutate()
              }}
              disabled={endMutation.isPending}
            >
              {endMutation.isPending ? 'Encerrando…' : 'Encerrar sessão'}
            </Button>
          )}
          {session.status === 'ended' && (
            <Button asChild variant="outline">
              <Link to="/">Voltar</Link>
            </Button>
          )}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-[260px_1fr]">
        {discovery && session.status !== 'ended' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como conectar</CardTitle>
              <CardDescription>Os alunos escaneiam o QR ou abrem a URL.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <img
                src={discovery.qrDataUrl}
                alt="QR para URL da sala"
                className="border-border rounded-md border bg-white p-1"
                width={220}
                height={220}
              />
              <div className="space-y-1 text-xs">
                <p className="text-muted-foreground">URL</p>
                <p className="font-mono">
                  http://{discovery.lanIp}:{discovery.port}/
                </p>
                <p className="text-muted-foreground mt-2">mDNS</p>
                <p className="font-mono">{discovery.mdnsName}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className={discovery && session.status !== 'ended' ? '' : 'md:col-span-2'}>
          <CardHeader>
            <CardTitle className="text-base">
              Alunos conectados ({session.students.length})
            </CardTitle>
            <CardDescription>
              {session.status === 'lobby'
                ? 'A lista atualiza em tempo real conforme os alunos entram.'
                : session.status === 'running'
                  ? 'Sessão em andamento. Stage 4 trará o status detalhado.'
                  : 'Sessão encerrada.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {session.students.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Aguardando alunos…
              </p>
            ) : (
              <ul className="divide-border divide-y">
                {session.students.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{s.name}</p>
                      <p className="text-muted-foreground text-xs">{s.matricula}</p>
                    </div>
                    {s.submittedAt && (
                      <span className="rounded-full bg-green-500/15 px-2 py-0.5 text-xs text-green-700 dark:text-green-300">
                        Enviou
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
