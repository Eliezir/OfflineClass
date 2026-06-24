import { useState } from 'react'
import { Check, Clock, Copy, Loader2, LogIn, QrCode, Users, Plus } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { useDiscoveryQuery } from '../queries'
import type { SessionDetail } from '../types'
import { RosterRow } from './roster-row'

type LobbyPanelProps = {
  session: SessionDetail
}

interface GroupCardProps {
  group: SessionDetail['groups'][0]
  groupMode: string
  onDropStudent: (studentId: string) => void
  onRemoveStudent: (studentId: string) => void
}

function GroupCard({ group, groupMode, onDropStudent, onRemoveStudent }: GroupCardProps): React.JSX.Element {
  const [isOver, setIsOver] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        if (groupMode === 'teacher') e.preventDefault()
      }}
      onDragEnter={() => {
        if (groupMode === 'teacher') setIsOver(true)
      }}
      onDragLeave={() => {
        setIsOver(false)
      }}
      onDrop={(e) => {
        if (groupMode === 'teacher') {
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
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm truncate max-w-40">{group.name}</h3>
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
          {group.members.length} membros
        </span>
      </div>
      <div className="flex-1 space-y-1 mt-1">
        {group.members.map((m) => (
          <div
            key={m.studentId}
            draggable={groupMode === 'teacher'}
            onDragStart={(e) => {
              if (groupMode === 'teacher') {
                e.dataTransfer.setData('studentId', m.studentId)
                e.dataTransfer.setData('fromGroupId', group.id)
              }
            }}
            className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-border/40 text-xs bg-muted/20 ${
              groupMode === 'teacher' ? 'cursor-grab active:cursor-grabbing hover:bg-muted/40 hover:border-border transition-colors' : ''
            }`}
          >
            <span className="truncate max-w-44 font-medium">{m.studentName}</span>
            {groupMode === 'teacher' && (
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

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
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
      <section className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-5">
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
          <div className="flex flex-1 min-h-0 gap-6">
            {/* Left Column: Unassigned Students */}
            <div
              onDragOver={(e) => {
                if (session.groupMode === 'teacher') e.preventDefault()
              }}
              onDragEnter={() => {
                if (session.groupMode === 'teacher') setIsUnassignedOver(true)
              }}
              onDragLeave={() => {
                setIsUnassignedOver(false)
              }}
              onDrop={async (e) => {
                if (session.groupMode === 'teacher') {
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
                }
              }}
              className={`w-80 flex shrink-0 flex-col min-h-0 rounded-xl border p-4 transition-colors ${
                isUnassignedOver ? 'border-primary bg-primary-soft/10' : 'border-border/60 bg-muted/20'
              }`}
            >
              <div className="flex shrink-0 items-center justify-between gap-3 mb-3">
                <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  <Trans>Sem grupo ({unassignedStudents.length})</Trans>
                </h2>
              </div>
              <div className="scrollbar-subtle flex-1 overflow-y-auto space-y-1.5 pr-1">
                {unassignedStudents.length > 0 ? (
                  unassignedStudents.map((s) => (
                    <div
                      key={s.id}
                      draggable={session.groupMode === 'teacher'}
                      onDragStart={(e) => {
                        e.dataTransfer.setData('studentId', s.id)
                        e.dataTransfer.setData('fromGroupId', '')
                      }}
                      className={session.groupMode === 'teacher' ? 'cursor-grab active:cursor-grabbing hover:bg-muted/40 rounded-xl transition-colors' : ''}
                    >
                      <RosterRow student={s} />
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
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex shrink-0 items-center justify-between gap-3 mb-3">
                <h2 className="text-sm font-bold flex items-center gap-2">
                  <Users className="size-4" />
                  <Trans>Grupos ({groups.length})</Trans>
                </h2>
                {session.groupMode === 'teacher' && (
                  <div className="flex items-center gap-2">
                    {showCreate ? (
                      <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        <input
                          type="text"
                          placeholder={t`Nome do grupo`}
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                          className="h-8 rounded-lg border border-input-border bg-input px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary w-36"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateGroup()
                          }}
                        />
                        <Button size="xs" onClick={handleCreateGroup} disabled={!newGroupName.trim()}>
                          <Trans>Criar</Trans>
                        </Button>
                        <Button size="xs" variant="ghost" onClick={() => {
                          setShowCreate(false)
                          setNewGroupName('')
                        }}>
                          <Trans>Cancelar</Trans>
                        </Button>
                      </div>
                    ) : (
                      <Button size="xs" variant="outline" onClick={() => setShowCreate(true)}>
                        <Plus className="size-3.5" />
                        <Trans>Novo Grupo</Trans>
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="scrollbar-subtle flex-1 overflow-y-auto pr-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.length > 0 ? (
                  groups.map((g) => (
                    <GroupCard
                      key={g.id}
                      group={g}
                      groupMode={session.groupMode}
                      onDropStudent={(studentId) => handleDropToGroup(studentId, g.id)}
                      onRemoveStudent={(studentId) => handleRemoveFromGroup(g.id, studentId)}
                    />
                  ))
                ) : (
                  <div className="col-span-full py-12">
                    <EmptyState
                      compact
                      icon={<Users />}
                      title={t`Nenhum grupo`}
                      description={
                        session.groupMode === 'teacher'
                          ? <Trans>Crie grupos e arraste alunos para eles.</Trans>
                          : <Trans>Os alunos criarão grupos no lobby.</Trans>
                      }
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
