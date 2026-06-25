import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, LogIn, RefreshCw, Loader2, Pencil } from 'lucide-react'
import { JoinInput, type AvatarConfig } from '@offlineclass/shared'
import { Avatar, randomAvatar } from '@offlineclass/avatar'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createApi } from '../lib/api'
import { saveToken } from '../lib/session'
import { notify } from '../lib/toast'
import { useServerUrl } from '../lib/serverContext'
import { loadProfile, saveProfile, getLastMatricula } from '../lib/studentProfile'

type Step = 'matricula' | 'back' | 'identity'

export default function JoinRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { teacherUrl } = useServerUrl()
  const api = createApi(teacherUrl)

  const [step, setStep] = useState<Step>('matricula')
  const [matricula, setMatricula] = useState(getLastMatricula() ?? '')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState<AvatarConfig>(() => randomAvatar())
  const [error, setError] = useState<string | null>(null)

  if (!teacherUrl) {
    navigate('/', { replace: true })
    return <></>
  }

  const active = useQuery({
    queryKey: ['session', 'active', teacherUrl],
    queryFn: api.sessionActive,
    refetchInterval: 3000,
    retry: false
  })

  const joinMutation = useMutation({
    mutationFn: (input: JoinInput) => api.join(input),
    onSuccess: (res) => {
      saveToken(res.token)
      saveProfile({
        name: res.studentName,
        matricula: res.studentMatricula,
        email: email.trim() || null,
        avatar
      })
      notify.success(`Bem-vindo, ${res.studentName}!`)
      navigate(res.status === 'running' ? '/test' : '/waiting', { replace: true })
    },
    onError: (err: Error) => {
      setError(err.message)
      notify.error(err.message)
    }
  })

  const handleRefresh = (): void =>
    void qc.invalidateQueries({ queryKey: ['session', 'active', teacherUrl] })

  const noSession = active.isError && (active.error as Error & { status?: number })?.status === 404
  const sessionAvailable =
    active.data && (active.data.status === 'lobby' || active.data.status === 'running')
  const examTitle = active.data?.examTitle

  // ── Step transitions ──────────────────────────────────────────────────
  function continueFromMatricula(): void {
    const m = matricula.trim()
    if (m.length < 2) {
      setError('Digite sua matrícula')
      return
    }
    setError(null)
    const saved = loadProfile(m)
    if (saved) {
      setName(saved.name)
      setEmail(saved.email ?? '')
      if (saved.avatar) setAvatar(saved.avatar)
      setStep('back')
    } else {
      setStep('identity')
    }
  }

  function resetToMatricula(): void {
    setStep('matricula')
    setError(null)
  }

  function join(): void {
    setError(null)
    const input: JoinInput = {
      name: name.trim(),
      matricula: matricula.trim(),
      email: email.trim() || undefined,
      avatar
    }
    const parsed = JoinInput.safeParse(input)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Dados inválidos')
      return
    }
    saveProfile({ name: input.name, matricula: input.matricula, email: email.trim() || null, avatar })
    joinMutation.mutate(parsed.data)
  }

  const joining = joinMutation.isPending

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 overflow-y-auto px-6 py-10">
      <div className="flex flex-col items-center gap-2">
        <img src="/logo-icon.png" alt="OfflineClass" className="size-12 rounded-2xl shadow-sm" />
        <span className="text-muted-foreground font-display text-sm font-bold tracking-tight">
          OfflineClass
        </span>
      </div>
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
          {active.isPending && (
            <div className="flex flex-col items-center gap-3 py-6">
              <Loader2 className="text-muted-foreground size-5 animate-spin" />
              <p className="text-muted-foreground text-sm">Conectando ao servidor…</p>
            </div>
          )}

          {noSession && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="bg-muted/50 flex flex-col items-center gap-3 rounded-2xl p-4">
                <Loader2 className="text-muted-foreground size-5 animate-spin" />
                <p className="text-sm font-medium">Aguardando o professor abrir a sala…</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Esta tela atualiza automaticamente a cada 3 segundos.
                </p>
              </div>
              <Button variant="secondary" className="w-full" onClick={handleRefresh}>
                <RefreshCw className="size-4" />
                Verificar agora
              </Button>
              <Button variant="ghost" size="sm" className="w-full" onClick={() => navigate('/', { replace: true })}>
                <ArrowLeft className="size-3.5" />
                Voltar
              </Button>
            </div>
          )}

          {sessionAvailable && (
            <div className="space-y-4">
              {/* progress (hidden on the recognized "welcome back" shortcut) */}
              {step !== 'back' && (
                <div className="flex gap-1.5">
                  {(['matricula', 'identity'] as const).map((s, i) => {
                    const order = { matricula: 0, identity: 1 }
                    const reached = order[step as 'matricula' | 'identity'] >= i
                    return (
                      <span
                        key={s}
                        className={`h-1.5 flex-1 rounded-full ${reached ? 'bg-primary' : 'bg-muted'}`}
                      />
                    )
                  })}
                </div>
              )}

              {/* STEP: matrícula */}
              {step === 'matricula' && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    continueFromMatricula()
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="matricula">Qual é a sua matrícula?</Label>
                    <Input
                      id="matricula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="0000-0000"
                      className="h-12 text-center text-lg font-bold tracking-wider"
                      autoFocus
                    />
                    <p className="text-muted-foreground text-xs">
                      Já entrou neste computador? Recuperamos seu perfil automaticamente.
                    </p>
                  </div>
                  {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                  <Button type="submit" className="w-full" size="lg">
                    Continuar
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
              )}

              {/* STEP: welcome back (recognized matrícula) */}
              {step === 'back' && (
                <div className="space-y-4">
                  <div className="flex flex-col items-center gap-2 text-center">
                    <Avatar config={avatar} size={96} />
                    <span className="bg-secondary-soft text-secondary-soft-foreground mt-1 rounded-full px-3 py-1 text-xs font-bold">
                      👋 Bem-vindo de volta!
                    </span>
                    <p className="text-lg font-bold">{name}</p>
                    <p className="text-muted-foreground text-sm">Matrícula {matricula}</p>
                    {email && <p className="text-muted-foreground text-xs">{email}</p>}
                  </div>
                  {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                  <Button className="w-full" size="lg" disabled={joining} onClick={join}>
                    {joining ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                    Entrar na sala
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="flex-1" onClick={() => setStep('identity')}>
                      <Pencil className="size-3.5" />
                      Editar
                    </Button>
                    <Button variant="secondary" className="flex-1" onClick={resetToMatricula}>
                      Não sou eu
                    </Button>
                  </div>
                </div>
              )}

              {/* STEP: identity (name + email) */}
              {step === 'identity' && (
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (name.trim().length < 2) {
                      setError('Informe seu nome')
                      return
                    }
                    join()
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome" autoFocus />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">
                      E-mail <span className="text-muted-foreground">(opcional)</span>
                    </Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
                    <p className="text-muted-foreground text-xs">
                      O professor pode usar para enviar seu resultado. Fica salvo neste computador.
                    </p>
                  </div>
                  {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={resetToMatricula}>
                      <ArrowLeft className="size-4" />
                    </Button>
                    <Button type="submit" className="flex-1" size="lg" disabled={joining}>
                      {joining ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}
                      Entrar na sala
                    </Button>
                  </div>
                </form>
              )}
            </div>
          )}

          {active.isError && !noSession && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <p className="text-destructive text-sm">Erro ao conectar: {String(active.error)}</p>
              <Button variant="secondary" className="w-full" onClick={handleRefresh}>
                <RefreshCw className="size-4" />
                Tentar novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
