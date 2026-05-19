import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import type { SessionStatus } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

function statusBadge(status: SessionStatus): { label: string; tone: string } {
  if (status === 'lobby')
    return { label: 'No lobby', tone: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' }
  if (status === 'running')
    return { label: 'Em andamento', tone: 'bg-green-500/15 text-green-700 dark:text-green-300' }
  return { label: 'Encerrada', tone: 'bg-muted text-muted-foreground' }
}

function formatDate(ms: number): string {
  return new Date(ms).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export default function HomeRoute(): React.JSX.Element {
  const { teacher } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const discovery = useQuery({
    queryKey: ['discovery', 'status'],
    queryFn: api.discovery.getStatus
  })

  const activeSession = useQuery({
    queryKey: ['sessions', 'active'],
    queryFn: api.sessions.active
  })

  const sessionsList = useQuery({
    queryKey: ['sessions', 'list'],
    queryFn: api.sessions.list
  })

  const onLogout = async (): Promise<void> => {
    await api.auth.logout()
    await qc.invalidateQueries({ queryKey: ['auth', 'me'] })
    navigate('/login', { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-8 p-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-xs tracking-widest uppercase">OfflineClass</p>
          <h1 className="text-3xl font-semibold">Olá, {teacher?.name}</h1>
          <p className="text-muted-foreground text-sm">{teacher?.email}</p>
        </div>
        <Button variant="outline" onClick={onLogout}>
          Sair
        </Button>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Provas</CardTitle>
            <CardDescription>Crie e edite provas para aplicar na sala.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/exams">Abrir provas</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Aplicar prova</CardTitle>
            <CardDescription>
              {activeSession.data
                ? 'Há uma sessão ativa — retomar.'
                : 'Inicie uma sessão para os alunos entrarem pela LAN.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={activeSession.data ? `/sessions/${activeSession.data.id}` : '/sessions/new'}>
                {activeSession.data ? 'Voltar ao lobby' : 'Nova sessão'}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Atividades aplicadas</CardTitle>
          <CardDescription>
            Sessões anteriores, ao vivo e em andamento. Clique para ver os alunos e corrigir as respostas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sessionsList.isPending && (
            <p className="text-muted-foreground text-sm">Carregando…</p>
          )}
          {sessionsList.data && sessionsList.data.length === 0 && (
            <p className="text-muted-foreground py-6 text-center text-sm">
              Nenhuma atividade ainda. Abra uma nova sessão para começar.
            </p>
          )}
          {sessionsList.data && sessionsList.data.length > 0 && (
            <ul className="divide-border divide-y">
              {sessionsList.data.map((s) => {
                const badge = statusBadge(s.status)
                const when = s.startedAt ?? s.createdAt
                return (
                  <li key={s.id}>
                    <Link
                      to={`/sessions/${s.id}`}
                      className="hover:bg-muted/60 -mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-3 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{s.examTitle}</p>
                        <p className="text-muted-foreground text-xs">
                          {formatDate(when)} · {s.durationMinutes} min
                        </p>
                      </div>
                      <div className="flex items-center gap-3 text-right text-xs">
                        <div>
                          <p className="text-muted-foreground">Alunos</p>
                          <p className="font-medium">
                            {s.submittedCount}/{s.studentsCount}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            badge.tone
                          )}
                        >
                          {badge.label}
                        </span>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>

      {discovery.data && (
        <Card>
          <CardHeader>
            <CardTitle>Servidor local</CardTitle>
            <CardDescription>Endereços que os alunos podem usar para conectar.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
            <img
              src={discovery.data.qrDataUrl}
              alt="QR para URL da sala"
              className="border-border rounded-lg border p-1"
              width={160}
              height={160}
            />
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs uppercase">URL</dt>
                <dd className="font-mono">
                  http://{discovery.data.lanIp}:{discovery.data.port}/
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs uppercase">mDNS</dt>
                <dd className="font-mono">{discovery.data.mdnsName}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </main>
  )
}
