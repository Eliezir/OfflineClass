import { useState } from 'react'
import {
  Check,
  Clock,
  Copy,
  Loader2,
  LogIn,
  QrCode,
  Users,
  Plus,
  GripVertical,
  Info,
  ChevronRight,
  User,
  X,
  UserMinus,
  Trash2
} from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@renderer/shared/ui/dialog'
import { useDiscoveryQuery } from '../queries'
import type { SessionDetail } from '../types'
import { RosterRow } from './roster-row'
import { StudentAvatar } from './student-avatar'

type LobbyPanelProps = {
  session: SessionDetail
}

interface GroupCardProps {
  group: SessionDetail['groups'][0]
  groupMode: string
  onDropStudent: (studentId: string) => void
  onRemoveStudent: (studentId: string) => void
  onStudentContextMenu: (
    e: React.MouseEvent,
    studentId: string,
    studentName: string,
    groupId: string
  ) => void
  onDeleteGroup: (groupId: string, groupName: string) => void
}

function GroupCard({
  group,
  groupMode,
  onDropStudent,
  onRemoveStudent,
  onStudentContextMenu,
  onDeleteGroup
}: GroupCardProps): React.JSX.Element {
  const [isOver, setIsOver] = useState(false)
  const { t } = useLingui()

  return (
    <div
      onDragOver={(e) => {
        if (groupMode !== 'disabled') e.preventDefault()
      }}
      onDragEnter={() => {
        if (groupMode !== 'disabled') setIsOver(true)
      }}
      onDragLeave={() => {
        setIsOver(false)
      }}
      onDrop={(e) => {
        if (groupMode !== 'disabled') {
          e.preventDefault()
          setIsOver(false)
          const studentId = e.dataTransfer.getData('studentId')
          if (studentId) {
            onDropStudent(studentId)
          }
        }
      }}
      className={`rounded-xl border p-4 flex flex-col gap-2 transition-colors ${
        isOver ? 'border-primary bg-primary-soft/10 shadow-sm' : 'border-border bg-card'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-bold text-sm truncate max-w-40">{group.name}</h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {group.members.length} membros
          </span>
          {groupMode !== 'disabled' && (
            <button
              type="button"
              onClick={() => onDeleteGroup(group.id, group.name)}
              className="text-muted-foreground hover:text-destructive hover:bg-muted p-1 rounded-lg transition-colors focus:outline-none"
              title={t`Excluir grupo`}
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1 space-y-1 mt-1">
        {group.members.map((m) => (
          <div
            key={m.studentId}
            draggable={groupMode !== 'disabled'}
            onDragStart={(e) => {
              if (groupMode !== 'disabled') {
                e.dataTransfer.setData('studentId', m.studentId)
                e.dataTransfer.setData('fromGroupId', group.id)
              }
            }}
            onContextMenu={(e) => {
              if (groupMode !== 'disabled') {
                onStudentContextMenu(e, m.studentId, m.studentName, group.id)
              }
            }}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border/40 text-xs bg-muted/20 ${
              groupMode !== 'disabled'
                ? 'cursor-grab active:cursor-grabbing hover:bg-muted/40 hover:border-border transition-colors'
                : ''
            }`}
          >
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              {groupMode !== 'disabled' && (
                <GripVertical className="size-3.5 shrink-0 text-muted-foreground/60" />
              )}
              <StudentAvatar name={m.studentName} avatar={m.avatar} className="size-6" />
              <span className="truncate font-medium">{m.studentName}</span>
            </div>
            {groupMode !== 'disabled' && (
              <button
                type="button"
                onClick={() => onRemoveStudent(m.studentId)}
                className="text-muted-foreground hover:text-destructive text-[10px] font-bold shrink-0 ml-1.5 focus:outline-none"
              >
                <Trans>Remover</Trans>
              </button>
            )}
          </div>
        ))}
        {group.members.length === 0 && (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            <Trans>Nenhum aluno</Trans>
          </p>
        )}
      </div>
    </div>
  )
}

/** Lobby: how-to-join card on the left, roster on the right. */
export function LobbyPanel({ session }: LobbyPanelProps): React.JSX.Element {
  const { t } = useLingui()
  const discovery = useDiscoveryQuery(true)
  const [copied, setCopied] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [isUnassignedOver, setIsUnassignedOver] = useState(false)
  const [showBanner, setShowBanner] = useState(true)
  const [studentToKick, setStudentToKick] = useState<{ id: string; name: string } | null>(null)
  const [groupToDelete, setGroupToDelete] = useState<{ id: string; name: string } | null>(null)

  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    studentId: string
    studentName: string
    currentGroupId: string | null
  } | null>(null)

  const handleStudentContextMenu = (
    e: React.MouseEvent,
    studentId: string,
    studentName: string,
    currentGroupId: string | null
  ) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      studentId,
      studentName,
      currentGroupId
    })
  }

  const closeContextMenu = () => setContextMenu(null)

  // Match the scheme the QR encodes — the LAN server is HTTPS-only, so a
  // scheme-less address would resolve to http and fail to connect.
  const joinUrl = discovery.data ? `https://${discovery.data.lanIp}:${discovery.data.port}` : null
  const students = session.students
  const groups = session.groups || []

  // Group membership derived state
  const studentsInGroups = new Set(groups.flatMap((g) => g.members.map((m) => m.studentId)))
  const unassignedStudents = students.filter((s) => !studentsInGroups.has(s.id))

  async function copyUrl(): Promise<void> {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return
    try {
      await window.api.sessions.createGroup(session.id, newGroupName, '')
      setNewGroupName('')
      setShowCreate(false)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDropToGroup = async (studentId: string, toGroupId: string) => {
    try {
      await window.api.sessions.joinGroup(toGroupId, studentId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleRemoveFromGroup = async (fromGroupId: string, studentId: string) => {
    try {
      await window.api.sessions.leaveGroup(fromGroupId, studentId)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await window.api.sessions.deleteGroup(groupId)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[360px_1fr] overflow-y-auto lg:overflow-y-hidden pr-1">
      {/* Join info */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold">
          <Trans>Como os alunos entram</Trans>
        </h2>

        <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
          {discovery.data?.qrDataUrl ? (
            <img
              src={discovery.data.qrDataUrl}
              alt={t`QR code para entrar na sessão`}
              className="size-full object-contain p-3"
            />
          ) : discovery.isLoading ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <QrCode className="size-20" strokeWidth={1.25} />
              <span className="text-xs font-semibold">
                <Trans>QR indisponível</Trans>
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-bold text-muted-foreground">
            <Trans>Endereço na rede</Trans>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded-[10px] border border-input-border bg-input px-3 py-2 font-mono text-sm font-bold">
              {joinUrl ?? '—'}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyUrl}
              disabled={!joinUrl}
              aria-label={t`Copiar endereço`}
              title={t`Copiar endereço`}
            >
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {session.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LogIn className="size-3.5" />
            {session.allowLateJoin ? (
              <Trans>Entrada tardia: sim</Trans>
            ) : (
              <Trans>Entrada tardia: não</Trans>
            )}
          </span>
        </div>
      </section>

      {/* Roster */}
      <section className="flex min-h-0 flex-1 flex-col rounded-2xl border border-border bg-card p-5">
        {session.groupMode === 'disabled' ? (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <h2 className="text-sm font-bold">
                <Trans>Alunos na sala</Trans>
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-soft-foreground">
                <Users className="size-3.5" />
                {students.length}
              </span>
            </div>

            <div className="scrollbar-subtle mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
              {students.length > 0 ? (
                students.map((s) => <RosterRow key={s.id} student={s} />)
              ) : (
                <EmptyState
                  compact
                  icon={<Users />}
                  title={t`Aguardando alunos`}
                  description={<Trans>Os alunos aparecem aqui assim que entram pela rede.</Trans>}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex flex-col md:flex-row flex-1 min-h-0 gap-6">
              {/* Left Column: Unassigned Students */}
              <div className="w-full md:w-80 flex md:shrink-0 flex-col min-h-[250px] md:min-h-0">
                <div className="flex shrink-0 items-center justify-between gap-3 mb-3">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <User className="size-4 text-muted-foreground/80" />
                    <Trans>Sem grupo ({unassignedStudents.length})</Trans>
                  </h2>
                </div>

                <div
                  onDragOver={(e) => {
                    e.preventDefault()
                  }}
                  onDragEnter={() => {
                    setIsUnassignedOver(true)
                  }}
                  onDragLeave={() => {
                    setIsUnassignedOver(false)
                  }}
                  onDrop={async (e) => {
                    e.preventDefault()
                    setIsUnassignedOver(false)
                    const studentId = e.dataTransfer.getData('studentId')
                    const fromGroupId = e.dataTransfer.getData('fromGroupId')
                    if (studentId && fromGroupId) {
                      try {
                        await window.api.sessions.leaveGroup(fromGroupId, studentId)
                      } catch (err) {
                        console.error(err)
                      }
                    }
                  }}
                  className={`scrollbar-subtle flex-1 overflow-y-auto space-y-1.5 pr-1 rounded-xl transition-colors p-2 ${
                    isUnassignedOver
                      ? 'border-2 border-dashed border-primary bg-primary-soft/10'
                      : 'border-2 border-dashed border-transparent'
                  }`}
                >
                  {unassignedStudents.length > 0 ? (
                    unassignedStudents.map((s) => (
                      <div
                        key={s.id}
                        draggable={true}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('studentId', s.id)
                          e.dataTransfer.setData('fromGroupId', '')
                        }}
                        onContextMenu={(e) => {
                          handleStudentContextMenu(e, s.id, s.name, null)
                        }}
                        className="flex items-center gap-1.5 cursor-grab active:cursor-grabbing hover:bg-muted/40 rounded-xl transition-colors px-2 border border-transparent hover:border-border/40"
                      >
                        <GripVertical className="size-4 shrink-0 text-muted-foreground/60" />
                        <div className="flex-1 min-w-0">
                           <RosterRow student={s} />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic text-center py-6">
                      <Trans>Todos os alunos possuem grupo</Trans>
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Groups Grid */}
              <div className="flex-1 flex flex-col min-h-[350px] md:min-h-0">
                <div className="flex shrink-0 items-center justify-between gap-3 mb-3">
                  <h2 className="text-sm font-bold flex items-center gap-2">
                    <Users className="size-4" />
                    <Trans>Grupos ({groups.length})</Trans>
                  </h2>
                  {session.groupMode === 'teacher' && (
                    <Button size="xs" variant="outline" onClick={() => setShowCreate(true)}>
                      <Plus className="size-3.5" />
                      <Trans>Novo Grupo</Trans>
                    </Button>
                  )}
                </div>

                <div className="scrollbar-subtle flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
                  {groups.length > 0 ? (
                    groups.map((g) => (
                      <GroupCard
                        key={g.id}
                        group={g}
                        groupMode={session.groupMode}
                        onDropStudent={(studentId) => handleDropToGroup(studentId, g.id)}
                        onRemoveStudent={(studentId) => handleRemoveFromGroup(g.id, studentId)}
                        onStudentContextMenu={(e, studentId, studentName, groupId) =>
                          handleStudentContextMenu(e, studentId, studentName, groupId)
                        }
                        onDeleteGroup={(groupId, name) => setGroupToDelete({ id: groupId, name })}
                      />
                    ))
                  ) : (
                    <div className="w-full py-12">
                      <EmptyState
                        compact
                        icon={<Users />}
                        title={t`Nenhum grupo`}
                        description={<Trans>Crie grupos e arraste alunos para eles.</Trans>}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Banner Informativo / Instrução para o Professor */}
            {session.groupMode === 'teacher' && showBanner && (
              <div className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary-soft/10 p-3.5 mt-4 text-xs text-primary-soft-foreground leading-relaxed animate-in fade-in slide-in-from-bottom-1 duration-200 shrink-0">
                <Info className="size-4 shrink-0 text-primary mt-0.5" />
                <div className="flex-1">
                  <strong className="font-semibold">
                    <Trans>Modo de Grupos Controlado pelo Professor:</Trans>
                  </strong>{' '}
                  <Trans>
                    Organize os alunos arrastando-os entre as colunas "Sem grupo" e os grupos
                    criados (lastro visual com o indicador de arrastar). Você também pode clicar com
                    o botão direito sobre qualquer aluno para acessar ações rápidas como remoção de
                    grupo ou remoção da sala.
                  </Trans>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBanner(false)}
                  className="text-primary hover:bg-primary-soft/20 p-1 rounded-lg transition-colors focus:outline-none shrink-0 ml-2"
                  title={t`Fechar aviso`}
                >
                  <X className="size-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Dialog para criação de grupo */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open)
          if (!open) setNewGroupName('')
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              <Trans>Novo Grupo</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>Insira o nome do novo grupo para esta sessão de prova.</Trans>
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <input
              type="text"
              placeholder={t`Nome do grupo`}
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="w-full h-10 rounded-lg border border-input-border bg-input px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateGroup()
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreate(false)
                setNewGroupName('')
              }}
            >
              <Trans>Cancelar</Trans>
            </Button>
            <Button onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
              <Trans>Criar grupo</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu de contexto customizado */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={closeContextMenu}
            onContextMenu={(e) => {
              e.preventDefault()
              closeContextMenu()
            }}
          />
          <div
            className="fixed z-50 min-w-38 bg-popover text-popover-foreground border border-border shadow-md rounded-xl p-2 animate-in fade-in zoom-in-95 duration-200 flex flex-col"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground uppercase border-b border-border/40 mb-1 truncate max-w-48">
              {contextMenu.studentName}
            </div>

            {groups.length > 0 && (
              <div className="relative group/submenu">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-medium hover:bg-muted rounded-lg text-left"
                >
                  <span>
                    <Trans>Enviar para grupo</Trans>
                  </span>
                  <ChevronRight className="size-3" />
                </button>
                <div className="absolute left-full top-0 pl-1.5 hidden group-hover/submenu:flex z-[60]">
                  <div className="flex flex-col min-w-40 bg-popover text-popover-foreground border border-border shadow-md rounded-xl p-1 max-h-48 overflow-y-auto">
                    {groups.map((g) => {
                      const isDisabled = g.id === contextMenu.currentGroupId
                      return (
                        <button
                          key={g.id}
                          type="button"
                          disabled={isDisabled}
                          onClick={async () => {
                            closeContextMenu()
                            try {
                              await window.api.sessions.joinGroup(g.id, contextMenu.studentId)
                            } catch (err) {
                              console.error(err)
                            }
                          }}
                          className={`w-full px-2.5 py-1.5 text-xs font-medium rounded-lg text-left truncate ${
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed text-muted-foreground'
                              : 'hover:bg-muted'
                          }`}
                        >
                          {g.name}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {contextMenu.currentGroupId && (
              <button
                type="button"
                onClick={async () => {
                  closeContextMenu()
                  if (contextMenu.currentGroupId) {
                    try {
                      await window.api.sessions.leaveGroup(
                        contextMenu.currentGroupId,
                        contextMenu.studentId
                      )
                    } catch (err) {
                      console.error(err)
                    }
                  }
                }}
                className="w-full px-2.5 py-1.5 text-xs font-medium hover:bg-muted rounded-lg text-left"
              >
                <Trans>Remover do grupo</Trans>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                closeContextMenu()
                setStudentToKick({ id: contextMenu.studentId, name: contextMenu.studentName })
              }}
              className="w-full px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg text-left border-t border-border/40 mt-1 pt-1.5"
            >
              <Trans>Remover da sala</Trans>
            </button>
          </div>
        </>
      )}

      {/* Dialog para confirmação de remoção de aluno da sala */}
      <Dialog
        open={studentToKick !== null}
        onOpenChange={(open) => {
          if (!open) setStudentToKick(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <UserMinus className="size-5" />
              <Trans>Remover Aluno</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>
                Tem certeza que deseja remover <strong>{studentToKick?.name}</strong> da sala de
                aula? Esta ação irá desconectá-lo desta sessão.
              </Trans>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setStudentToKick(null)}>
              <Trans>Cancelar</Trans>
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (studentToKick) {
                  try {
                    await window.api.sessions.kickStudent(session.id, studentToKick.id)
                  } catch (err) {
                    console.error(err)
                  } finally {
                    setStudentToKick(null)
                  }
                }
              }}
            >
              <Trans>Remover da sala</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para confirmação de exclusão de grupo */}
      <Dialog
        open={groupToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setGroupToDelete(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <Trash2 className="size-5" />
              <Trans>Excluir Grupo</Trans>
            </DialogTitle>
            <DialogDescription>
              <Trans>
                Tem certeza que deseja excluir o grupo <strong>{groupToDelete?.name}</strong>? Os alunos deste grupo voltarão para a lista de alunos sem grupo.
              </Trans>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="ghost" onClick={() => setGroupToDelete(null)}>
              <Trans>Cancelar</Trans>
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (groupToDelete) {
                  await handleDeleteGroup(groupToDelete.id)
                  setGroupToDelete(null)
                }
              }}
            >
              <Trans>Excluir grupo</Trans>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
