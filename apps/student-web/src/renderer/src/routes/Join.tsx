import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, LogIn, RefreshCw, Loader2 } from 'lucide-react'
import { JoinInput } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createApi } from '../lib/api'
import { saveToken } from '../lib/session'
import { notify } from '../lib/toast'
import { useServerUrl } from '../lib/serverContext'
import { loadProfile, saveProfile, initials } from '../lib/studentProfile'
import { maskEmail } from '../lib/mask'

export default function JoinRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { teacherUrl } = useServerUrl()
  const api = createApi(teacherUrl)

  const storedRaw = loadProfile()
  // A complete profile (with e-mail) can join straight from the chip; a legacy
  // profile without e-mail falls back to the form so the now-required e-mail is filled.
  const stored = storedRaw?.email ? storedRaw : null
  const [name, setName] = useState(storedRaw?.name ?? '')
  const [matricula, setMatricula] = useState(storedRaw?.matricula ?? '')
  const [email, setEmail] = useState(storedRaw?.email ?? '')
  const [error, setError] = useState<string | null>(null)

  if (!teacherUrl) {
    navigate('/', { replace: true })
    return <></>
  }

  const active = useQuery({
    queryKey: ['session', 'active', teacherUrl],
    queryFn: api.sessionActive,
    // Poll every 3s — the session might appear at any moment.
    refetchInterval: 3000,
    retry: false
  })

  const joinMutation = useMutation({
    mutationFn: () => {
      const profile = stored ?? { name, matricula, email: email.trim() }
      const parsed = JoinInput.safeParse(profile)
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      }
      return api.join(parsed.data)
    },
    onSuccess: (res) => {
      saveToken(res.token)
      saveProfile({ name: res.studentName, matricula: res.studentMatricula })
      notify.success(`Bem-vindo, ${res.studentName}!`)
      if (res.status === 'running') {
        navigate('/test', { replace: true })
      } else {
        navigate('/waiting', { replace: true })
      }
    },
    onError: (err: Error) => {
      setError(err.message)
      notify.error(err.message)
    }
  })

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault()
    setError(null)
    joinMutation.mutate()
  }

  const handleRefresh = (): void => {
    qc.invalidateQueries({ queryKey: ['session', 'active', teacherUrl] })
  }

  const noSession = active.isError && (active.error as Error & { status?: number })?.status === 404
  const sessionAvailable =
    active.data && (active.data.status === 'lobby' || active.data.status === 'running')
  const examTitle = active.data?.examTitle

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 overflow-y-auto">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar na prova</CardTitle>
          <CardDescription>
            {noSession
              ? 'Nenhuma sessão ativa no momento.'
              : examTitle
                ? `Prova: ${examTitle}`
                : 'Conectando ao servidor…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ── Loading ────────────────────────────────────────────────── */}
          {active.isPending && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
              <p className="text-muted-foreground text-sm">Conectando ao servidor…</p>
            </div>
          )}

          {/* ── No active session ──────────────────────────────────────── */}
          {noSession && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-2xl p-4">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
                <p className="text-sm font-medium">Aguardando o professor abrir a sala…</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  O professor ainda não iniciou uma sessão. Esta tela atualiza automaticamente a
                  cada 3 segundos.
                </p>
              </div>
              <Button variant="secondary" className="w-full" onClick={handleRefresh}>
                <RefreshCw className="size-4" />
                Verificar agora
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate('/', { replace: true })}
              >
                <ArrowLeft className="size-3.5" />
                Voltar
              </Button>
            </div>
          )}

          {/* ── Session available ──────────────────────────────────────── */}
          {sessionAvailable && (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Profile chip (if registered) */}
              {stored ? (
                <div className="bg-primary-soft border-primary/10 flex items-center gap-3 rounded-2xl border p-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {initials(stored.name)}
                  </span>
                  <div className="min-w-0 text-left">
                    <p className="truncate text-sm font-bold text-primary-soft-foreground">
                      {stored.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{stored.matricula}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Seu nome"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="Número de matrícula"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(maskEmail(e.target.value))}
                      placeholder="Para receber sua nota"
                    />
                  </div>
                </>
              )}

              {error && <p className="text-destructive text-sm font-medium">{error}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={joinMutation.isPending}>
                {joinMutation.isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Entrando…
                  </>
                ) : (
                  <>
                    <LogIn className="size-4" />
                    Entrar na sala
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate('/', { replace: true })}
              >
                <ArrowLeft className="size-3.5" />
                Voltar
              </Button>
            </form>
          )}

          {/* ── Error loading (not 404) ─────────────────────────────────── */}
          {active.isError && !noSession && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <p className="text-destructive text-sm">Erro ao conectar: {String(active.error)}</p>
              <Button variant="secondary" className="w-full" onClick={handleRefresh}>
                <RefreshCw className="size-4" />
                Tentar novamente
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => navigate('/', { replace: true })}
              >
                <ArrowLeft className="size-3.5" />
                Voltar
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
