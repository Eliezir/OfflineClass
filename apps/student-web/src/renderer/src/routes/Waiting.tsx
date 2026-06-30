import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { LogOut, Plus, Users, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react'
import type { GroupPublic } from '@offlineclass/shared'
import { Avatar } from '@offlineclass/avatar'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TeacherChip } from '@/components/TeacherChip'
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
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)


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

  // Public session info — only needed here for the teacher chip (whose room).
  const sessionQuery = useQuery({
    queryKey: ['session', 'active', teacherUrl],
    queryFn: api.sessionActive,
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

  const renameGroupMutation = useMutation({
    mutationFn: ({ groupId, name }: { groupId: string; name: string }) =>
      api.groups.update(groupId, name),
    onSuccess: () => {
      setEditingGroupId(null)
      qc.invalidateQueries({ queryKey: ['groups', teacherUrl] })
      notify.success('Grupo renomeado!')
    },
    onError: (err: Error) => notify.error(err.message)
  })

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) => api.groups.delete(groupId),
    onSuccess: () => {
      setDeletingGroupId(null)
      qc.invalidateQueries({ queryKey: ['groups', teacherUrl] })
      notify.success('Grupo excluído!')
    },
    onError: (err: Error) => notify.error(err.message)
  })


  const groups: GroupPublic[] = groupsQuery.data ?? []
  const myStudentId = meQuery.data?.studentId
  const myGroup = groups.find((g) => g.members.some((m) => m.studentId === myStudentId))

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-10 overflow-y-auto">
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
          {sessionQuery.data?.teacherName && (
            <TeacherChip
              name={sessionQuery.data.teacherName}
              avatar={sessionQuery.data.teacherAvatar}
            />
          )}
          <p className="text-muted-foreground text-sm">
            {meQuery.data
              ? `Matrícula: ${meQuery.data.studentMatricula}`
              : 'Obtendo informações da sessão…'}
          </p>
          {/* ── Groups UI ───────────────────────────────────────────── */}
          {meQuery.data?.groupMode === 'free' && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Users className="size-3.5 text-primary" />
                  Grupos de Trabalho
                </div>

                {groups.length > 0 ? (
                  <div className="max-h-[260px] overflow-y-auto pr-1.5 space-y-2">
                    {groups.map((g) => {
                      const isMyGroup = myGroup?.id === g.id
                      const isEditing = editingGroupId === g.id

                      if (isEditing) {
                        return (
                          <div
                            key={g.id}
                            className="border-primary/45 bg-primary-soft/10 flex flex-col gap-2 rounded-xl border p-3 shadow-xs animate-in fade-in zoom-in-95 duration-150"
                          >
                            <div className="flex items-center gap-2">
                              <Input
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="h-8 text-xs font-semibold flex-1"
                                placeholder="Nome do grupo"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && editingName.trim()) {
                                    renameGroupMutation.mutate({ groupId: g.id, name: editingName })
                                  } else if (e.key === 'Escape') {
                                    setEditingGroupId(null)
                                  }
                                }}
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/20"
                                onClick={() => renameGroupMutation.mutate({ groupId: g.id, name: editingName })}
                                disabled={!editingName.trim() || renameGroupMutation.isPending}
                              >
                                <Check className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground"
                                onClick={() => setEditingGroupId(null)}
                              >
                                <X className="size-4" />
                              </Button>
                            </div>
                          </div>
                        )
                      }

                      return (
                        <div
                          key={g.id}
                          className={`flex flex-col gap-2 rounded-xl border p-3 transition-all ${
                            isMyGroup
                              ? 'border-primary/50 bg-primary-soft/20 shadow-xs'
                              : 'border-border bg-card hover:border-muted-foreground/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className={`truncate text-sm font-bold ${isMyGroup ? 'text-primary' : 'text-foreground'}`}>
                                  {g.name}
                                </p>
                                {isMyGroup && (
                                  <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                    Seu Grupo
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {isMyGroup ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-primary/80 hover:text-primary hover:bg-primary-soft/40"
                                    title="Editar nome"
                                    onClick={() => {
                                      setEditingGroupId(g.id)
                                      setEditingName(g.name)
                                    }}
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
                                    title="Excluir grupo"
                                    onClick={() => setDeletingGroupId(g.id)}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    className="h-7 px-2 text-xs font-semibold hover:bg-primary-soft/30 text-primary"
                                    onClick={() => leaveGroupMutation.mutate(g.id)}
                                  >
                                    Sair
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-7 text-xs px-2.5 font-semibold hover:bg-primary-soft/30 hover:border-primary/30 text-primary-soft-foreground"
                                  onClick={() => joinGroupMutation.mutate(g.id)}
                                  disabled={joinGroupMutation.isPending}
                                >
                                  Entrar
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Members List */}
                          <div className="flex flex-wrap gap-1 items-center mt-0.5">
                            <span className="font-medium text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1">
                              Membros:
                            </span>
                            {g.members.length > 0 ? (
                              g.members.map((m) => {
                                const isMe = m.studentId === myStudentId
                                return (
                                  <span
                                    key={m.studentId}
                                    className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                                      isMe
                                        ? 'bg-primary/15 text-primary font-bold border border-primary/25'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                                  >
                                    {m.avatar && <Avatar config={m.avatar} size={16} />}
                                    {m.studentName}
                                    {isMe && <span className="text-[9px] font-normal opacity-85">(Você)</span>}
                                  </span>
                                )
                              })
                            ) : (
                              <span className="text-muted-foreground/50 italic text-[11px]">Vazio</span>
                            )}
                          </div>

                          {/* Delete Confirmation Inline */}
                          {deletingGroupId === g.id && (
                            <div className="bg-destructive/5 border border-destructive/20 mt-1 flex flex-col gap-1.5 rounded-lg p-2.5 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                              <p className="font-bold text-destructive flex items-center gap-1">
                                <AlertCircle className="size-3.5" />
                                Excluir grupo permanentemente?
                              </p>
                              <p className="text-muted-foreground text-[10px] leading-relaxed">
                                Todos os integrantes serão removidos do grupo e precisarão entrar ou criar outro.
                              </p>
                              <div className="flex justify-end gap-1.5 mt-0.5">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-6 px-2 text-[10px] text-muted-foreground hover:bg-muted"
                                  onClick={() => setDeletingGroupId(null)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-6 px-2.5 text-[10px] font-semibold"
                                  onClick={() => deleteGroupMutation.mutate(g.id)}
                                  disabled={deleteGroupMutation.isPending}
                                >
                                  Confirmar Exclusão
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-center border border-dashed border-border rounded-xl px-4 bg-muted/20 animate-in fade-in duration-300">
                    <Users className="size-8 text-muted-foreground/40 mb-1.5" />
                    <p className="text-xs font-bold text-muted-foreground">Nenhum grupo ativo</p>
                    <p className="text-[10px] text-muted-foreground/75 mt-0.5 max-w-[200px] leading-relaxed">
                      Seja o primeiro a criar um grupo de trabalho abaixo!
                    </p>
                  </div>
                )}
              </div>

              {/* ── Create group ─────────────────────────────────────────── */}
              <div className="border-t border-border/60 pt-3">
                {myGroup ? (
                  <div className="bg-muted/40 border border-border/50 rounded-xl p-2.5 text-xs text-muted-foreground flex items-start gap-2">
                    <AlertCircle className="size-4 text-muted-foreground/70 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-muted-foreground/90">
                        Você já está no grupo <span className="text-primary font-bold">{myGroup.name}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground/60 mt-0.5 leading-relaxed">
                        Para criar outro grupo, primeiro saia ou exclua o seu grupo atual.
                      </p>
                    </div>
                  </div>
                ) : showCreate ? (
                  <div className="flex flex-col gap-2 p-2 border border-primary/20 bg-primary-soft/10 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <Input
                      placeholder="Nome do novo grupo"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="h-8 text-xs font-semibold"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newGroupName.trim()) {
                          createGroupMutation.mutate()
                        } else if (e.key === 'Escape') {
                          setShowCreate(false)
                          setNewGroupName('')
                        }
                      }}
                    />
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:bg-muted"
                        onClick={() => {
                          setShowCreate(false)
                          setNewGroupName('')
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs px-3 font-semibold"
                        onClick={() => createGroupMutation.mutate()}
                        disabled={!newGroupName.trim() || createGroupMutation.isPending}
                      >
                        {createGroupMutation.isPending ? 'Criando...' : 'Criar Grupo'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-8 text-xs font-bold border-primary/20 text-primary hover:bg-primary-soft/30 hover:border-primary/30 transition-all flex items-center justify-center gap-1.5"
                    onClick={() => setShowCreate(true)}
                  >
                    <Plus className="size-3.5" />
                    Criar novo grupo
                  </Button>
                )}
              </div>
            </>
          )}

          {meQuery.data?.groupMode === 'teacher' && (
            <div className="border-t border-border/60 pt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                <Users className="size-3.5" />
                Grupo (Definido pelo Professor)
              </div>
              {myGroup ? (
                <div className="border-border rounded-xl border px-3 py-2 bg-primary-soft/10">
                  <p className="text-sm font-semibold text-primary">{myGroup.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1">
                    {myGroup.members.map((m) => (
                      <span
                        key={m.studentId}
                        className="bg-muted text-muted-foreground inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
                      >
                        {m.avatar && <Avatar config={m.avatar} size={16} />}
                        {m.studentName}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Aguardando o professor definir seu grupo...
                </p>
              )}
            </div>
          )}

          {meQuery.data?.groupMode === 'shuffle' && (
            <div className="border-t border-border/60 pt-3 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                <Users className="size-3.5 text-primary" />
                Sorteio de Grupos
              </div>
              {myGroup ? (
                <div className="border-primary/40 bg-primary-soft/20 rounded-xl border p-3 shadow-xs">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <p className="text-sm font-bold text-primary">{myGroup.name}</p>
                    <span className="bg-primary/10 text-primary rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                      Seu Grupo
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 items-center">
                    <span className="font-medium text-[10px] uppercase tracking-wider text-muted-foreground/60 mr-1">
                      Membros:
                    </span>
                    {myGroup.members.map((m) => {
                      const isMe = m.studentId === myStudentId
                      return (
                        <span
                          key={m.studentId}
                          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium ${
                            isMe
                              ? 'bg-primary/15 text-primary font-bold border border-primary/25'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {m.avatar && <Avatar config={m.avatar} size={16} />}
                          {m.studentName}
                          {isMe && <span className="text-[9px] font-normal opacity-85">(Você)</span>}
                        </span>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-muted/40 p-2.5 rounded-xl border border-border/50">
                  Aguardando o professor iniciar a prova e realizar o sorteio dos grupos...
                </p>
              )}
            </div>
          )}

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
