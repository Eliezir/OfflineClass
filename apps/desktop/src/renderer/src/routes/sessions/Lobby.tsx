import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from 'react-router-dom'
import type { SessionDetail, SessionLobbyStudent, WsServerEvent } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { api } from '../../lib/api'
import { connectWs, type WsStatus } from '../../lib/ws'

const IDLE_THRESHOLD_MS = 15_000

type StudentStatus = 'joined' | 'answering' | 'submitted' | 'idle'

interface Computed {
  status: StudentStatus
  secondsSinceLastSeen: number
}

function computeStudent(student: SessionLobbyStudent, now: number): Computed {
  if (student.submittedAt) {
    return { status: 'submitted', secondsSinceLastSeen: 0 }
  }
  const sinceLastSeen = now - student.lastSeenAt
  if (sinceLastSeen > IDLE_THRESHOLD_MS) {
    return { status: 'idle', secondsSinceLastSeen: Math.floor(sinceLastSeen / 1000) }
  }
  if (student.answeredCount > 0) {
    return { status: 'answering', secondsSinceLastSeen: Math.floor(sinceLastSeen / 1000) }
  }
  return { status: 'joined', secondsSinceLastSeen: Math.floor(sinceLastSeen / 1000) }
}

function statusTone(status: string): string {
  if (status === 'running') return 'bg-green-500/15 text-green-700 dark:text-green-300'
  if (status === 'ended') return 'bg-muted text-muted-foreground'
  return 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
}

function statusLabel(status: string): string {
  if (status === 'lobby') return 'No lobby'
  if (status === 'running') return 'Em andamento'
  return 'Encerrada'
}

function studentPillTone(status: StudentStatus): string {
  switch (status) {
    case 'submitted':
      return 'bg-green-500/15 text-green-700 dark:text-green-300'
    case 'answering':
      return 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
    case 'idle':
      return 'bg-red-500/15 text-red-700 dark:text-red-300'
    default:
      return 'bg-muted text-muted-foreground'
  }
}

function studentPillLabel(status: StudentStatus): string {
  switch (status) {
    case 'submitted':
      return 'Enviou'
    case 'answering':
      return 'Respondendo'
    case 'idle':
      return 'Inativo'
    default:
      return 'No lobby'
  }
}

function formatClock(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function LobbyRoute(): React.JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting')
  const [now, setNow] = useState(() => Date.now())

  // Tick every second so idle pills and the countdown stay fresh without
  // hammering the server.
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const sessionQuery = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => api.sessions.get(id),
    enabled: !!id
  })

  const discoveryQuery = useQuery({
    queryKey: ['discovery', 'status'],
    queryFn: api.discovery.getStatus
  })

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
        onStatus: (status) => {
          setWsStatus(status)
          // Recover from any events missed while the socket was down by
          // forcing a fresh IPC snapshot on (re)connect.
          if (status === 'open') {
            qc.invalidateQueries({ queryKey: ['sessions', id] })
          }
        },
        onEvent: (event: WsServerEvent) => {
          if (event.type === 'session.lobby.update') {
            // Patch the cached SessionDetail in place — avoids the IPC
            // round-trip and reflects the latest students list (with
            // submittedAt / answeredCount) on the very next render.
            qc.setQueryData<SessionDetail | undefined>(['sessions', id], (old) =>
              old ? { ...old, students: event.students } : old
            )
            return
          }
          if (event.type === 'session.started' || event.type === 'session.ended') {
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

  const session = sessionQuery.data

  const remainingSeconds = useMemo<number | null>(() => {
    if (!session || session.status !== 'running' || session.startedAt === null) return null
    const endAt = session.startedAt + session.durationMinutes * 60_000
    return Math.max(0, Math.floor((endAt - now) / 1000))
  }, [session, now])

  const computed = useMemo(() => {
    if (!session) return []
    return session.students.map((s) => ({ student: s, ...computeStudent(s, now) }))
  }, [session, now])

  const counters = useMemo(() => {
    const buckets: Record<StudentStatus, number> = {
      joined: 0,
      answering: 0,
      submitted: 0,
      idle: 0
    }
    for (const { status } of computed) buckets[status]++
    return buckets
  }, [computed])

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

  if (sessionQuery.isPending || !session) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <p className="text-muted-foreground text-sm">Carregando…</p>
      </main>
    )
  }

  const discovery = discoveryQuery.data
  const showQr = discovery && session.status !== 'ended'

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">
            <Link to="/">← Início</Link>
          </p>
          <h1 className="text-3xl font-semibold">{session.examTitle}</h1>
          <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                statusTone(session.status)
              )}
            >
              {statusLabel(session.status)}
            </span>
            <span>· {session.durationMinutes} min</span>
            <span>·</span>
            <span>WS: {wsStatus}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {session.status === 'running' && remainingSeconds !== null && (
            <div className="text-right">
              <p className="text-muted-foreground text-xs uppercase tracking-widest">Tempo</p>
              <p
                className={cn(
                  'font-mono text-2xl',
                  remainingSeconds === 0 && 'text-destructive animate-pulse'
                )}
              >
                {formatClock(remainingSeconds)}
              </p>
            </div>
          )}
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

      <section className="grid gap-3 sm:grid-cols-4">
        <CounterCard label="Conectados" value={session.students.length} />
        <CounterCard label="Respondendo" value={counters.answering} accent="sky" />
        <CounterCard label="Enviaram" value={counters.submitted} accent="green" />
        <CounterCard label="Inativos" value={counters.idle} accent="red" />
      </section>

      <section className={cn('grid gap-4', showQr && 'md:grid-cols-[260px_1fr]')}>
        {showQr && (
          <Card className="self-start">
            <CardHeader>
              <CardTitle className="text-base">Como conectar</CardTitle>
              <CardDescription>QR ou URL na LAN.</CardDescription>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Alunos ({session.students.length})
            </CardTitle>
            <CardDescription>
              {session.status === 'lobby'
                ? 'A lista atualiza em tempo real conforme entram.'
                : session.status === 'running'
                  ? 'Acompanhamento ao vivo.'
                  : 'Sessão encerrada.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {computed.length === 0 ? (
              <p className="text-muted-foreground py-8 text-center text-sm">
                Aguardando alunos…
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {computed.map(({ student, status, secondsSinceLastSeen }) => (
                  <StudentRow
                    key={student.id}
                    student={student}
                    status={status}
                    secondsSinceLastSeen={secondsSinceLastSeen}
                    questionsCount={session.questionsCount}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  )
}

interface CounterCardProps {
  label: string
  value: number
  accent?: 'sky' | 'green' | 'red'
}

function CounterCard({ label, value, accent }: CounterCardProps): React.JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <div className="space-y-0.5">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">{label}</p>
          <p
            className={cn(
              'text-2xl font-semibold',
              accent === 'sky' && 'text-sky-600 dark:text-sky-300',
              accent === 'green' && 'text-green-600 dark:text-green-300',
              accent === 'red' && 'text-red-600 dark:text-red-300'
            )}
          >
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

interface StudentRowProps {
  student: SessionLobbyStudent
  status: StudentStatus
  secondsSinceLastSeen: number
  questionsCount: number
}

function StudentRow({
  student,
  status,
  secondsSinceLastSeen,
  questionsCount
}: StudentRowProps): React.JSX.Element {
  const lastSeenLabel =
    status === 'submitted'
      ? 'enviou'
      : status === 'idle'
        ? `há ${secondsSinceLastSeen}s`
        : `há ${secondsSinceLastSeen}s`
  return (
    <li
      className={cn(
        'border-border bg-card flex items-center justify-between gap-3 rounded-md border p-3 text-sm',
        status === 'idle' && 'border-red-500/30',
        status === 'submitted' && 'border-green-500/30'
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium">{student.name}</p>
        <p className="text-muted-foreground text-xs">{student.matricula}</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right text-xs">
          <p className="text-muted-foreground">
            {student.answeredCount}/{questionsCount}
          </p>
          <p className="text-muted-foreground">{lastSeenLabel}</p>
        </div>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            studentPillTone(status)
          )}
        >
          {studentPillLabel(status)}
        </span>
      </div>
    </li>
  )
}
