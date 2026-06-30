import { useEffect, useState, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import * as awarenessProtocol from 'y-protocols/awareness'
import { ArrowLeft, Users, Terminal, User, Wifi, WifiOff } from 'lucide-react'
import { Button } from '@renderer/shared/ui/button'
import { Trans, useLingui } from '@lingui/react/macro'
import type { SessionDetail } from '../types'
import { useExamQuery } from '@renderer/modules/provas/queries'

// ---------------------------------------------------------------------------
// Sub-component: collaborative TipTap editor (essay / code) — read-only
// ---------------------------------------------------------------------------
interface GroupCollabEditorProps {
  questionId: string
  doc: Y.Doc
  awareness: Awareness
  kind: string
}

function GroupCollabEditor({
  questionId,
  doc,
  awareness,
  kind
}: GroupCollabEditorProps): React.JSX.Element {
  const editor = useEditor(
    {
      editable: false,
      extensions: [
        StarterKit.configure({ history: false } as any),
        Collaboration.configure({ document: doc, field: questionId }),
        CollaborationCursor.configure({
          provider: { awareness } as any,
          user: { name: 'Professor', color: '#3b82f6' }
        })
      ],
      editorProps: {
        attributes: {
          class: `min-h-[120px] p-3 w-full bg-background focus:outline-none prose prose-sm dark:prose-invert max-w-none border border-border rounded-lg ${
            kind === 'code' ? 'font-mono text-xs whitespace-pre-wrap' : ''
          }`
        }
      }
    },
    [doc, awareness, questionId, kind]
  )

  if (!editor) {
    return (
      <p className="text-xs text-muted-foreground animate-pulse">
        <Trans>Carregando visualização real-time...</Trans>
      </p>
    )
  }

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
interface GroupRealtimeMonitorProps {
  groupId: string
  session: SessionDetail
  onBack: () => void
  onSelectStudent: (studentId: string) => void
}

export function GroupRealtimeMonitor({
  groupId,
  session,
  onBack,
  onSelectStudent
}: GroupRealtimeMonitorProps): React.JSX.Element {
  const { t } = useLingui()
  const examQuery = useExamQuery(session.examId)
  const exam = examQuery.data

  // Local Y.Doc fed by IPC push updates — never by a teacher WS
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
  const [awareness, setAwareness] = useState<Awareness | null>(null)
  const [activeUsers, setActiveUsers] = useState<{ name: string; color: string }[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [connected, setConnected] = useState(false)

  const group = session.groups?.find((g) => g.id === groupId)
  const groupStudents = useMemo(() => {
    if (!group) return []
    return group.members
      .map((m) => session.students.find((s) => s.id === m.studentId))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
  }, [group, session.students])

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Create Y.Doc + Awareness, load initial snapshot via IPC, subscribe to
  //    push updates via IPC event for both Y.Doc and awareness.
  //    No WebSocket needed — everything goes through Electron IPC.
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    const doc = new Y.Doc()
    const aware = new Awareness(doc)
    setYdoc(doc)
    setAwareness(aware)
    setConnected(false)

    let destroyed = false
    let unsubYjs: (() => void) | null = null
    let unsubAwareness: (() => void) | null = null

    const init = async (): Promise<void> => {
      try {
        // ── Step 1: load initial snapshot from main process via IPC ──
        const snapshot = await window.api.sessions.getGroupYjsSnapshot(groupId)
        if (destroyed) return
        if (snapshot && snapshot.length > 0) {
          Y.applyUpdate(doc, new Uint8Array(snapshot), 'ipc-init')
          console.log(`[Monitor] Loaded initial snapshot: ${snapshot.length} bytes`)
        }

        // ── Step 2: subscribe to live Y.Doc push updates via IPC ──
        await window.api.sessions.subscribeGroupYjs(groupId)
        if (destroyed) return

        unsubYjs = window.api.sessions.onGroupYjsUpdate((gid, update) => {
          if (destroyed || gid !== groupId) return
          try {
            Y.applyUpdate(doc, new Uint8Array(update), 'ipc-push')
          } catch (err) {
            console.error('[Monitor] Failed to apply IPC Y.Doc update:', err)
          }
        })

        // ── Step 3: subscribe to awareness push updates via IPC ──
        await window.api.sessions.subscribeGroupAwareness(groupId)
        if (destroyed) return

        unsubAwareness = window.api.sessions.onGroupAwarenessUpdate((gid, encoded) => {
          if (destroyed || gid !== groupId) return
          try {
            awarenessProtocol.applyAwarenessUpdate(aware, new Uint8Array(encoded), 'ipc-push')
          } catch (err) {
            console.error('[Monitor] Failed to apply IPC awareness update:', err)
          }
        })

        // ── Step 4: set teacher's own local presence (shown as cursor) ──
        aware.setLocalStateField('user', {
          name: t`Professor`,
          color: '#3b82f6'
        })

        setConnected(true)
      } catch (err) {
        console.error('[Monitor] Initialization error:', err)
      }
    }

    init()

    return () => {
      destroyed = true
      if (unsubYjs) unsubYjs()
      if (unsubAwareness) unsubAwareness()
      window.api.sessions.unsubscribeGroupYjs(groupId).catch(() => {})
      window.api.sessions.unsubscribeGroupAwareness(groupId).catch(() => {})
      aware.destroy()
      doc.destroy()
    }
  }, [groupId, session.id, t])


  // ──────────────────────────────────────────────────────────────────────────
  // 2. Mirror awareness state → activeUsers
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!awareness) return

    const update = (): void => {
      const states = Array.from(awareness.getStates().values()) as any[]
      const users = states
        .filter((s) => s.user?.name)
        .map((s) => ({ name: s.user.name as string, color: (s.user.color as string) || '#3b82f6' }))
      setActiveUsers(users.filter((u, i, arr) => arr.findIndex((x) => x.name === u.name) === i))
    }

    awareness.on('change', update)
    update()
    return () => awareness.off('change', update)
  }, [awareness])

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Observe Y.Map('answers') → answers state for MCQ / truefalse / multi
  // ──────────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ydoc) return
    const map = ydoc.getMap<string>('answers')

    const sync = (): void => {
      const next: Record<string, string> = {}
      for (const key of map.keys()) next[key] = map.get(key) ?? ''
      setAnswers(next)
    }

    map.observe(sync)
    sync()
    return () => map.unobserve(sync)
  }, [ydoc])

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  if (!exam) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground select-none">
        <Trans>Carregando dados da prova…</Trans>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border/60 pb-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="rounded-xl">
            <ArrowLeft className="size-4" />
            <Trans>Voltar</Trans>
          </Button>
          <div className="h-4 w-px bg-border" />
          <h2 className="text-lg font-extrabold text-foreground flex items-center gap-2">
            <Users className="size-5 text-primary" />
            <span>{group?.name || t`Grupo`}</span>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {groupStudents.length} <Trans>membros</Trans>
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className="flex items-center gap-1.5 select-none">
            {connected ? (
              <>
                <Wifi className="size-3.5 text-success" />
                <span className="text-[10px] font-bold text-success uppercase tracking-wider">
                  <Trans>Tempo real</Trans>
                </span>
              </>
            ) : (
              <>
                <WifiOff className="size-3.5 text-muted-foreground animate-pulse" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  <Trans>Conectando…</Trans>
                </span>
              </>
            )}
          </div>

          {/* Active collaborators */}
          {activeUsers.length > 0 && (
            <div className="flex items-center gap-2 select-none">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <Trans>Editando agora:</Trans>
              </span>
              <div className="flex -space-x-1.5">
                {activeUsers.map((u, i) => {
                  const initials = u.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                  return (
                    <div
                      key={i}
                      className="inline-flex size-6 rounded-full ring-2 ring-background items-center justify-center text-[10px] font-extrabold text-white uppercase select-none cursor-help transition-transform hover:scale-110"
                      style={{ backgroundColor: u.color }}
                      title={u.name}
                    >
                      {initials}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-6 overflow-hidden min-h-0">
        {/* Left: Members list */}
        <section className="w-64 border border-border bg-card rounded-2xl p-4 flex flex-col shrink-0">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5 select-none">
            <User className="size-3.5" />
            <Trans>Membros do Grupo</Trans>
          </h3>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {groupStudents.map((student) => (
              <button
                key={student.id}
                type="button"
                onClick={() => onSelectStudent(student.id)}
                className="w-full text-left p-3 rounded-xl border border-border bg-muted/10 hover:bg-muted/40 hover:border-border/80 transition-all flex flex-col gap-1 focus:outline-none"
              >
                <span className="font-bold text-sm text-foreground truncate">{student.name}</span>
                <span className="text-xs text-muted-foreground">{student.matricula}</span>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      student.submittedAt
                        ? 'bg-success/10 text-success'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {student.submittedAt ? <Trans>Entregue</Trans> : <Trans>Em curso</Trans>}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {student.answeredCount}/{session.questionsCount} <Trans>resp.</Trans>
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Right: Live answers view */}
        <section className="flex-1 border border-border bg-card rounded-2xl p-5 flex flex-col overflow-hidden min-h-0">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5 shrink-0 select-none">
            <Terminal className="size-4 text-primary" />
            <Trans>Visualização do Y.Doc do Grupo (Tempo Real)</Trans>
          </h3>

          <div className="flex-1 overflow-y-auto pr-1 space-y-5">
            {exam.questions.map((q, idx) => {
              const value = answers[q.id] ?? null
              const answered = value !== null
              const isTextQuestion = q.kind === 'essay' || q.kind === 'code'

              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-border/80 p-4 bg-muted/5 flex flex-col gap-3"
                >
                  <header className="flex items-center gap-2 select-none">
                    <span className="grid size-5 place-items-center rounded-lg bg-muted text-[10px] font-bold text-muted-foreground">
                      {idx + 1}
                    </span>
                    <span className="rounded-full bg-muted/65 px-2 py-0.5 text-[9px] font-bold tracking-wide text-muted-foreground uppercase">
                      {q.kind === 'mcq'
                        ? t`Múltipla escolha`
                        : q.kind === 'multi'
                          ? t`Múltiplas respostas`
                          : q.kind === 'truefalse'
                            ? t`Verdadeiro ou falso`
                            : q.kind === 'code'
                              ? t`Código`
                              : t`Dissertativa`}
                    </span>
                  </header>

                  <p className="text-sm font-semibold text-foreground leading-snug">{q.prompt}</p>

                  {isTextQuestion ? (
                    <div className="w-full mt-1">
                      {ydoc && awareness ? (
                        <GroupCollabEditor
                          questionId={q.id}
                          doc={ydoc}
                          awareness={awareness}
                          kind={q.kind}
                        />
                      ) : (
                        <p className="text-xs text-muted-foreground animate-pulse">
                          <Trans>Carregando visualização real-time...</Trans>
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm mt-1">
                      {!answered ? (
                        <p className="text-xs text-muted-foreground italic">
                          <Trans>Não respondida</Trans>
                        </p>
                      ) : q.kind === 'mcq' ? (
                        <ul className="space-y-1.5">
                          {q.options.map((opt) => {
                            const isChosen = value === opt.id
                            return (
                              <li
                                key={opt.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${
                                  isChosen
                                    ? 'bg-primary/10 border-primary/40 text-primary-soft-foreground'
                                    : 'bg-background border-border/60 text-muted-foreground'
                                }`}
                              >
                                <span>{opt.text}</span>
                                {isChosen && (
                                  <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                    <Trans>Escolhido</Trans>
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      ) : q.kind === 'truefalse' ? (
                        <div className="flex gap-4 select-none">
                          {(['true', 'false'] as const).map((v) => (
                            <span
                              key={v}
                              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                                value === v
                                  ? 'bg-primary/10 border-primary/40 text-primary'
                                  : 'bg-background border-border/60 text-muted-foreground'
                              }`}
                            >
                              {v === 'true' ? <Trans>Verdadeiro</Trans> : <Trans>Falso</Trans>}
                            </span>
                          ))}
                        </div>
                      ) : q.kind === 'multi' ? (
                        <ul className="space-y-1.5">
                          {q.options.map((opt) => {
                            const selectedIds = new Set(value ? value.split(',') : [])
                            const isChosen = selectedIds.has(opt.id)
                            return (
                              <li
                                key={opt.id}
                                className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${
                                  isChosen
                                    ? 'bg-primary/10 border-primary/40 text-primary-soft-foreground'
                                    : 'bg-background border-border/60 text-muted-foreground'
                                }`}
                              >
                                <span>{opt.text}</span>
                                {isChosen && (
                                  <span className="text-[9px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-md uppercase tracking-wide">
                                    <Trans>Escolhido</Trans>
                                  </span>
                                )}
                              </li>
                            )
                          })}
                        </ul>
                      ) : null}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}
