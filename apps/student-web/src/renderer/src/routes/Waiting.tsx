import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut, Pencil, Users } from 'lucide-react'
import { Avatar, randomAvatar } from '@offlineclass/avatar'
import type { AvatarConfig, RosterStudent } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AvatarBuilder } from '@/components/avatar/AvatarBuilder'
import { createApi } from '../lib/api'
import { clearToken, loadToken } from '../lib/session'
import { notify } from '../lib/toast'
import { useServerUrl } from '../lib/serverContext'
import { connectStudentWs, type WsStatus } from '../lib/ws'
import { loadProfile, saveProfile } from '../lib/studentProfile'

export default function WaitingRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { teacherUrl } = useServerUrl()
  const api = createApi(teacherUrl)
  const [wsStatus, setWsStatus] = useState<WsStatus>('connecting')
  const [roster, setRoster] = useState<RosterStudent[]>([])
  const [builderOpen, setBuilderOpen] = useState(false)
  const [editAvatar, setEditAvatar] = useState<AvatarConfig>(() => randomAvatar())
  const [saving, setSaving] = useState(false)

  const meQuery = useQuery({
    queryKey: ['session', 'me', teacherUrl],
    queryFn: api.me,
    retry: false
  })
  const me = meQuery.data
  const myId = me?.studentId
  const myCard = roster.find((r) => r.id === myId)

  useEffect(() => {
    if (!teacherUrl) navigate('/', { replace: true })
  }, [teacherUrl, navigate])

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
    if (me?.status === 'running' && !me.submittedAt) navigate('/test', { replace: true })
    if (me?.submittedAt) navigate('/done', { replace: true })
    if (me?.status === 'ended' && !me.submittedAt) {
      notify.info('O professor encerrou a sessão.')
      navigate('/ended', { replace: true })
    }
  }, [me, navigate])

  useEffect(() => {
    const token = loadToken()
    if (!token) return
    const conn = connectStudentWs({
      token,
      baseUrl: teacherUrl,
      onStatus: setWsStatus,
      onEvent: (event) => {
        if (event.type === 'session.roster.update') setRoster(event.students)
        else qc.invalidateQueries({ queryKey: ['session', 'me', teacherUrl] })
      }
    })
    return () => conn.close()
  }, [qc, teacherUrl])

  useEffect(() => {
    const interval = setInterval(() => void api.heartbeat().catch(() => {}), 10_000)
    return () => clearInterval(interval)
  }, [api])

  const handleLeave = async (): Promise<void> => {
    try {
      await api.leave()
    } catch {
      /* best-effort */
    }
    clearToken()
    notify.info('Você saiu da sala.')
    navigate('/', { replace: true })
  }

  function openBuilder(): void {
    setEditAvatar(myCard?.avatar ?? randomAvatar())
    setBuilderOpen(true)
  }

  async function saveAvatar(): Promise<void> {
    setSaving(true)
    try {
      await api.updateAvatar(editAvatar)
      if (me) {
        const existing = loadProfile(me.studentMatricula)
        saveProfile({
          name: me.studentName,
          matricula: me.studentMatricula,
          email: existing?.email ?? null,
          avatar: editAvatar
        })
      }
      setBuilderOpen(false)
      notify.success('Avatar atualizado!')
    } catch {
      notify.error('Não foi possível salvar o avatar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center gap-6 px-6 py-10">
      <div className="flex flex-col items-center gap-2">
        <img src="/logo-icon.png" alt="OfflineClass" className="size-12 rounded-2xl shadow-sm" />
        <span className="text-muted-foreground font-display text-sm font-bold tracking-tight">OfflineClass</span>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle>Aguardando o professor</CardTitle>
          <CardDescription>
            {me ? `Você entrou como ${me.studentName}` : 'Carregando…'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Your avatar + edit */}
          <div className="bg-muted/40 flex items-center gap-3 rounded-2xl p-3">
            {myCard?.avatar ? (
              <Avatar config={myCard.avatar} size={56} />
            ) : (
              <span className="bg-primary-soft text-primary grid size-14 shrink-0 place-items-center rounded-full text-lg font-bold">
                {me?.studentName?.[0] ?? '?'}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold">{me?.studentName ?? '—'}</div>
              <div className="text-muted-foreground truncate text-xs font-semibold">
                {me?.studentMatricula ?? ''}
              </div>
            </div>
            <Button variant="secondary" size="sm" onClick={openBuilder}>
              <Pencil className="size-3.5" />
              Mudar avatar
            </Button>
          </div>

          {/* Other students */}
          <div>
            <div className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide">
              <Users className="size-3.5" />
              Na sala ({roster.length})
            </div>
            <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(96px,1fr))]">
              {roster.map((s) => (
                <div
                  key={s.id}
                  className={`relative flex flex-col items-center gap-2 rounded-2xl border p-3 text-center ${
                    s.id === myId ? 'border-primary bg-primary-soft/40' : 'border-border'
                  }`}
                >
                  {s.avatar ? (
                    <Avatar config={s.avatar} size={52} />
                  ) : (
                    <span className="bg-muted text-muted-foreground grid size-13 place-items-center rounded-full text-base font-bold">
                      {s.name[0] ?? '?'}
                    </span>
                  )}
                  <span className="w-full truncate text-xs font-bold">
                    {s.id === myId ? 'Você' : s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-muted-foreground text-center text-[11px] uppercase tracking-widest">
            Conexão: {wsStatus}
          </p>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleLeave}>
            <LogOut className="size-3.5" />
            Sair da sala
          </Button>
        </CardContent>
      </Card>

      {builderOpen && (
        <div className="bg-background fixed inset-0 z-50 flex flex-col">
          <div className="min-h-0 flex-1">
            <AvatarBuilder
              value={editAvatar}
              onChange={setEditAvatar}
              onDone={() => void saveAvatar()}
              onClose={() => setBuilderOpen(false)}
            />
          </div>
          {saving && (
            <div className="bg-background/60 absolute inset-0 grid place-items-center text-sm font-bold">
              Salvando…
            </div>
          )}
        </div>
      )}
    </main>
  )
}
