import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut, Plus, Users } from 'lucide-react'
import type { GroupPublic } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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
  const [newGroupName, setNewGroupName] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    if (!teacherUrl) navigate('/', { replace: true })
  }, [teacherUrl, navigate])

  const meQuery = useQuery({
    queryKey: ['session', 'me', teacherUrl],
    queryFn: api.me,
    retry: false
  })

  const groupsQuery = useQuery({
    queryKey: ['groups', teacherUrl],
    queryFn: api.groups.list,
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
      onEvent: (event) => {
        if (event.type === 'group.list') {
          qc.setQueryData(['groups', teacherUrl], event.groups)
        }
        qc.invalidateQueries({ queryKey: ['session', 'me', teacherUrl] })
      }
    })
    return () => conn.close()
  }, [qc, teacherUrl])

  useEffect(() => {
    const interval = setInterval(() => {
      void api.heartbeat().catch(() => {})
    }, 10_000)
    return () => clearInterval(interval)
  }, [api])

  const handleLeave = async (): Promise<void> => {
    try { await api.leave() } catch { /* best-effort */ }
    clearToken()
    notify.info('Você saiu da sala.')
    navigate('/', { replace: true })
  }

  const createGroupMutation = useMutation({
    mutationFn: () => api.groups.create(newGroupName),
    onSuccess: () => {
      setNewGroupName('')
      setShowCreate(false)
      qc.invalidateQueries({ queryKey: ['groups', teacherUrl] })
    },
    onError: (err: Error) => notify.error(err.message)
  })

  const joinGroupMutation = useMutation({
    mutationFn: (groupId: string) => api.groups.join(groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', teacherUrl] }),
    onError: (err: Error) => notify.error(err.message)
  })

  const leaveGroupMutation = useMutation({
    mutationFn: (groupId: string) => api.groups.leave(groupId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['groups', teacherUrl] }),
    onError: (err: Error) => notify.error(err.message)
  })

  const groups: GroupPublic[] = groupsQuery.data ?? []
  const myStudentId = meQuery.data?.studentId
  const myGroup = groups.find((g) => g.members.some((m) => m.studentId === myStudentId))

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10">
      <Card className="w-full max-w-sm">
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

          {/* ── Groups (free mode) ───────────────────────────────────── */}
          {groups.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Users className="size-3.5" />
                Grupos
              </div>
              <div className="space-y-1.5">
                {groups.map((g) => (
                  <div
                    key={g.id}
                    className="border-border flex items-center justify-between gap-2 rounded-xl border px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{g.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {g.members.map((m) => m.studentName).join(', ') || 'vazio'}
                      </p>
                    </div>
                    {myGroup?.id === g.id ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => leaveGroupMutation.mutate(g.id)}
                      >
                        Sair
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => joinGroupMutation.mutate(g.id)}
                        disabled={joinGroupMutation.isPending}
                      >
                        Entrar
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Create group ─────────────────────────────────────────── */}
          <div className="border-t border-border/60 pt-3">
            {showCreate ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Nome do grupo"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="h-8 text-xs"
                />
                <Button
                  size="sm"
                  onClick={() => createGroupMutation.mutate()}
                  disabled={!newGroupName.trim() || createGroupMutation.isPending}
                >
                  Criar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowCreate(false)}>
                  Cancelar
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => setShowCreate(true)}
              >
                <Plus className="size-3.5" />
                Criar grupo
              </Button>
            )}
          </div>

          <div className="border-border bg-muted/40 mx-auto h-1 w-40 overflow-hidden rounded-full">
            <div className="bg-primary h-full w-1/3 animate-pulse" />
          </div>
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            Conexão: {wsStatus}
          </p>
          <Button variant="ghost" size="sm" className="w-full" onClick={handleLeave}>
            <LogOut className="size-3.5" />
            Sair da sala
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
