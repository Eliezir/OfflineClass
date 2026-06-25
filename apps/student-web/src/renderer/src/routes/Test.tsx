import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { StudentQuestion } from '@offlineclass/shared'
import * as Y from 'yjs'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { Awareness } from 'y-protocols/awareness'
import * as awarenessProtocol from 'y-protocols/awareness'
import { Users, Bold, Italic, Code, RefreshCw, ArrowLeft, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { createApi } from '../lib/api'
import { clearToken, loadToken } from '../lib/session'
import { notify } from '../lib/toast'
import { useServerUrl } from '../lib/serverContext'
import { connectStudentWs } from '../lib/ws'

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function TestRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { teacherUrl } = useServerUrl()
  const api = createApi(teacherUrl)

  useEffect(() => {
    if (!teacherUrl) navigate('/', { replace: true })
  }, [teacherUrl, navigate])

  useEffect(() => {
    if (!loadToken()) navigate('/', { replace: true })
  }, [navigate])

  const examQuery = useQuery({
    queryKey: ['exam', 'current', teacherUrl],
    queryFn: api.exam,
    retry: false
  })

  const meQuery = useQuery({
    queryKey: ['session', 'me', teacherUrl],
    queryFn: api.me,
    retry: false
  })

  const groupsQuery = useQuery({
    queryKey: ['groups', teacherUrl],
    queryFn: api.groups.list,
    enabled: !!teacherUrl && meQuery.data?.groupMode !== 'disabled',
    retry: false
  })

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  const [ydoc, setYdoc] = useState<Y.Doc | null>(null)
  const [awareness, setAwareness] = useState<any>(null)

  useEffect(() => {
    const doc = new Y.Doc()
    const aware = new Awareness(doc)
    setYdoc(doc)
    setAwareness(aware)

    return () => {
      aware.destroy()
      doc.destroy()
    }
  }, [])

  const answersMap = useMemo(() => ydoc?.getMap<string>('answers') ?? null, [ydoc])


  useEffect(() => {
    if (!meQuery.data || !examQuery.data) return
    setDrafts((cur) => {
      const next: Record<string, string> = { ...cur }
      for (const q of examQuery.data.questions) {
        if (q.kind === 'code' && q.starterCode && next[q.id] === undefined) {
          next[q.id] = q.starterCode
        }
      }
      for (const a of meQuery.data.answers) {
        next[a.questionId] = a.value
      }
      return next
    })
  }, [meQuery.data?.studentId, examQuery.data])

  useEffect(() => {
    if (meQuery.data?.submittedAt) navigate('/done', { replace: true })
    if (meQuery.data?.status === 'ended') navigate('/ended', { replace: true })
    if (meQuery.error) {
      const status = (meQuery.error as Error & { status?: number }).status
      if (status === 401) {
        clearToken()
        navigate('/', { replace: true })
      }
    }
  }, [meQuery.data, meQuery.error, navigate])

  // Sync Y.Doc with socket updates
  useEffect(() => {
    if (!ydoc || !awareness) return

    const token = loadToken()
    if (!token) return
    const conn = connectStudentWs({
      token,
      baseUrl: teacherUrl,
      onEvent: (event) => {
        if (event.type === 'session.ended') {
          notify.info('O professor encerrou a sessão.')
          navigate('/ended', { replace: true })
        }
        if (event.type === 'session.started') {
          qc.invalidateQueries({ queryKey: ['exam', 'current', teacherUrl] })
          qc.invalidateQueries({ queryKey: ['session', 'me', teacherUrl] })
        }
        if (event.type === 'group.list') {
          qc.setQueryData(['groups', teacherUrl], event.groups)
        }
        if (event.type === 'student.submitted') {
          qc.invalidateQueries({ queryKey: ['session', 'me', teacherUrl] })
        }
      },
      onBinary: (data) => {
        if (meQuery.data?.groupMode === 'disabled') return
        const array = new Uint8Array(data)
        const type = array[0]
        const payload = array.subarray(1)
        if (type === 0) {
          Y.applyUpdate(ydoc, payload, 'socket')
        } else if (type === 1) {
          awarenessProtocol.applyAwarenessUpdate(awareness, payload, 'socket')
        }
      }
    })

    const onDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin === 'socket') return
      const payload = new Uint8Array(update.length + 1)
      payload[0] = 0 // type 0: Sync Update
      payload.set(update, 1)
      conn.sendBinary(payload)
    }

    if (meQuery.data?.groupMode && meQuery.data.groupMode !== 'disabled') {
      ydoc.on('update', onDocUpdate)

      // Set initial local awareness state
      awareness.setLocalStateField('user', {
        name: meQuery.data?.studentName ?? 'User',
        color: ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'][ydoc.clientID % 12]
      })

      // When local awareness changes, send update
      awareness.on('update', (update: any, origin: any) => {
        if (origin === 'socket') return
        const { added, updated, removed } = update
        const changedClients = added.concat(updated).concat(removed)
        const encodedUpdate = awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients)
        const payload = new Uint8Array(encodedUpdate.length + 1)
        payload[0] = 1 // type 1: Awareness Update
        payload.set(encodedUpdate, 1)
        conn.sendBinary(payload)
      })
    }

    return () => {
      ydoc.off('update', onDocUpdate)
      conn.close()
    }
  }, [navigate, qc, teacherUrl, ydoc, awareness, meQuery.data?.groupMode, meQuery.data?.studentName])

  // Observe Yjs document changes and update react-state drafts
  useEffect(() => {
    if (!meQuery.data || meQuery.data.groupMode === 'disabled' || !answersMap) return

    const observeAnswers = () => {
      setDrafts((prev) => {
        const next = { ...prev }
        let changed = false
        for (const key of answersMap.keys()) {
          const val = answersMap.get(key) ?? ''
          if (next[key] !== val) {
            next[key] = val
            changed = true
          }
        }
        return changed ? next : prev
      })
    }

    answersMap.observe(observeAnswers)
    observeAnswers()

    return () => {
      answersMap.unobserve(observeAnswers)
    }
  }, [answersMap, meQuery.data?.groupMode])

  useEffect(() => {
    const interval = setInterval(() => {
      void api.heartbeat().catch(() => {})
    }, 10_000)
    return () => clearInterval(interval)
  }, [api])

  const startedAt = examQuery.data?.startedAt ?? null
  const durationMinutes = examQuery.data?.durationMinutes ?? 0
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])
  const remainingSeconds = useMemo(() => {
    if (!startedAt || !durationMinutes) return null
    const endAt = startedAt + durationMinutes * 60_000
    return Math.max(0, Math.floor((endAt - now) / 1000))
  }, [startedAt, durationMinutes, now])

  const answerMutation = useMutation({
    mutationFn: ({ questionId, value }: { questionId: string; value: string }) =>
      api.answer({ questionId, value })
  })

  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const updateDraft = (questionId: string, value: string): void => {
    if (meQuery.data?.groupMode && meQuery.data.groupMode !== 'disabled' && answersMap) {
      if (answersMap.get(questionId) !== value) {
        answersMap.set(questionId, value)
      }
    } else {
      setDrafts((cur) => ({ ...cur, [questionId]: value }))
    }

    if (debounceRefs.current[questionId]) {
      clearTimeout(debounceRefs.current[questionId])
    }
    debounceRefs.current[questionId] = setTimeout(() => {
      answerMutation.mutate({ questionId, value })
    }, 500)
  }

  const submitMutation = useMutation({
    mutationFn: () => api.submit(),
    onSuccess: () => {
      notify.success('Prova enviada com sucesso!')
      navigate('/done', { replace: true })
    },
    onError: (err: Error) => {
      notify.error(err.message || 'Erro ao enviar a prova. Tente novamente.')
    }
  })

  useEffect(() => {
    if (
      remainingSeconds === 0 &&
      !submitMutation.isPending &&
      !submitMutation.isSuccess &&
      !meQuery.data?.submittedAt
    ) {
      submitMutation.mutate()
    }
  }, [remainingSeconds, meQuery.data?.submittedAt, submitMutation])

  if (examQuery.isPending || meQuery.isPending) {
    return (
      <main className="p-8">
        <p className="text-muted-foreground text-sm">Carregando prova…</p>
      </main>
    )
  }
  if (examQuery.error || !examQuery.data) {
    return (
      <main className="flex flex-1 items-center justify-center p-6 bg-background">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-md text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="inline-flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertCircle className="size-6" />
          </div>
          
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-foreground">Não foi possível carregar a prova</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Ocorreu um erro ao buscar os dados da prova. Por favor, verifique se a sessão já foi iniciada pelo professor ou tente novamente.
            </p>
            {examQuery.error && (
              <div className="mt-2 rounded-lg bg-muted/40 border border-border/50 p-2.5 text-xs text-destructive font-mono break-all text-left">
                {String(examQuery.error)}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-2">
            <Button
              variant="outline"
              onClick={() => {
                clearToken()
                navigate('/', { replace: true })
              }}
              className="flex-1 flex items-center justify-center gap-2 h-10 font-bold"
            >
              <ArrowLeft className="size-4" />
              Retornar ao início
            </Button>
            <Button
              variant="default"
              onClick={() => {
                examQuery.refetch()
                meQuery.refetch()
              }}
              className="flex-1 flex items-center justify-center gap-2 h-10 font-bold"
            >
              <RefreshCw className="size-4" />
              Atualizar tela
            </Button>
          </div>
        </div>
      </main>
    )
  }

  const exam = examQuery.data
  const answeredCount = Object.values(drafts).filter((v) => v.trim().length > 0).length

  const groups = groupsQuery.data ?? []
  const myStudentId = meQuery.data?.studentId
  const myGroup = groups.find((g) => g.members.some((m) => m.studentId === myStudentId))

  return (
    <main className="flex flex-1 flex-col pb-32 overflow-y-auto">
      <div className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <div className="space-y-1">
            {myGroup ? (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold">
                    {meQuery.data?.studentName} · {meQuery.data?.studentMatricula}
                  </p>
                  <span className="bg-primary/10 text-primary border border-primary/20 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 animate-in fade-in duration-200">
                    <Users className="size-2.5" />
                    {myGroup.name}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground/80 leading-none">
                  <span className="font-semibold">Membros:</span> {myGroup.members.map((m) => m.studentId === myStudentId ? `${m.studentName} (Você)` : m.studentName).join(', ')}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-xs uppercase tracking-widest">
                {meQuery.data?.studentName} · {meQuery.data?.studentMatricula}
              </p>
            )}
            <h1 className="text-base font-semibold">{exam.examTitle}</h1>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground text-xs">
              {answeredCount} / {exam.questions.length} respondidas
            </p>
            <p className="font-mono text-sm">
              {remainingSeconds !== null ? formatTime(remainingSeconds) : '--:--'}
            </p>
          </div>
        </div>
      </div>

      <ol className="mx-auto flex max-w-2xl flex-col gap-4 p-4">
        {exam.questions.map((q, idx) => (
          <QuestionCard
            key={q.id}
            index={idx + 1}
            question={q}
            value={drafts[q.id] ?? ''}
            onChange={(v) => updateDraft(q.id, v)}
            doc={ydoc}
            awareness={awareness}
            studentName={meQuery.data?.studentName ?? 'Estudante'}
            groupMode={meQuery.data?.groupMode ?? 'disabled'}
          />
        ))}
      </ol>

      <div className="border-border bg-background/95 fixed bottom-0 left-0 right-0 border-t backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {answerMutation.isPending ? 'Salvando…' : 'Auto-save ligado'}
          </p>
          <Button
            onClick={() => setShowSubmitDialog(true)}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Enviando…' : 'Enviar prova'}
          </Button>

          {/* ── Submit confirmation dialog ──────────────────────────── */}
          <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Enviar prova?</DialogTitle>
                <DialogDescription>
                  Você não poderá alterar as respostas depois de enviar.
                  {answeredCount < exam.questions.length && (
                    <span className="text-warning mt-1 block font-medium">
                      Atenção: você respondeu {answeredCount} de {exam.questions.length} questões.
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setShowSubmitDialog(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => {
                    setShowSubmitDialog(false)
                    submitMutation.mutate()
                  }}
                >
                  Enviar prova
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </main>
  )
}

interface QuestionCardProps {
  index: number
  question: StudentQuestion
  value: string
  onChange: (value: string) => void
  doc: Y.Doc | null
  awareness: any
  studentName: string
  groupMode: string
}

function QuestionCard({
  index,
  question,
  value,
  onChange,
  doc,
  awareness,
  studentName,
  groupMode
}: QuestionCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {index}. {question.prompt}
        </CardTitle>
        <CardDescription>
          {question.kind === 'mcq'
            ? 'Múltipla escolha'
            : question.kind === 'code'
              ? 'Código'
              : question.kind === 'truefalse'
                ? 'Verdadeiro ou Falso'
                : question.kind === 'multi'
                  ? 'Múltipla resposta'
                  : 'Dissertativa'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {question.image && (
          <img
            src={question.image}
            alt=""
            className="max-h-60 rounded-xl border border-border object-contain mb-3"
          />
        )}

        {question.kind === 'mcq' ? (
          <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
            {question.options.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <RadioGroupItem value={opt.id} id={`q-${question.id}-${opt.id}`} />
                <Label htmlFor={`q-${question.id}-${opt.id}`} className="cursor-pointer">
                  {opt.text}
                </Label>
              </div>
            ))}
          </RadioGroup>
        ) : question.kind === 'truefalse' ? (
          <RadioGroup value={value} onValueChange={onChange} className="space-y-2">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="true" id={`q-${question.id}-true`} />
              <Label htmlFor={`q-${question.id}-true`} className="cursor-pointer">
                Verdadeiro
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="false" id={`q-${question.id}-false`} />
              <Label htmlFor={`q-${question.id}-false`} className="cursor-pointer">
                Falso
              </Label>
            </div>
          </RadioGroup>
        ) : question.kind === 'multi' ? (
          <div className="space-y-2">
            {question.options.map((opt) => {
              const selectedIds = new Set(value ? value.split(',') : [])
              const handleCheckedChange = (checked: boolean) => {
                if (checked) {
                  selectedIds.add(opt.id)
                } else {
                  selectedIds.delete(opt.id)
                }
                onChange(Array.from(selectedIds).join(','))
              }
              return (
                <div key={opt.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q-${question.id}-${opt.id}`}
                    checked={selectedIds.has(opt.id)}
                    onChange={(e) => handleCheckedChange(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary bg-background border"
                  />
                  <Label htmlFor={`q-${question.id}-${opt.id}`} className="cursor-pointer">
                    {opt.text}
                  </Label>
                </div>
              )
            })}
          </div>
        ) : groupMode !== 'disabled' ? (
          <CollabEditor
            questionId={question.id}
            doc={doc}
            awareness={awareness}
            studentName={studentName}
            value={value}
            onChange={onChange}
            kind={question.kind}
            starterCode={'starterCode' in question ? question.starterCode : undefined}
          />
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={question.kind === 'code' ? 10 : 5}
            className={question.kind === 'code' ? 'font-mono text-xs whitespace-pre bg-background border rounded-md p-3' : ''}
            spellCheck={question.kind !== 'code'}
            placeholder={question.kind === 'code' ? 'Escreva seu código aqui…' : 'Escreva sua resposta…'}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface CollabEditorProps {
  questionId: string
  doc: Y.Doc | null
  awareness: any
  studentName: string
  value: string
  onChange: (val: string) => void
  disabled?: boolean
  kind?: string
  starterCode?: string
}

function CollabEditor({
  questionId,
  doc,
  awareness,
  studentName,
  value: _value,
  onChange,
  disabled,
  kind,
  starterCode
}: CollabEditorProps): React.JSX.Element {
  const hash = studentName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const colors = [
    '#f43f5e',
    '#ec4899',
    '#d946ef',
    '#a855f7',
    '#8b5cf6',
    '#6366f1',
    '#3b82f6',
    '#0ea5e9',
    '#06b6d4',
    '#14b8a6',
    '#10b981',
    '#22c55e',
    '#84cc16',
    '#eab308',
    '#f97316'
  ]
  const color = colors[hash % colors.length]

  const [activeUsers, setActiveUsers] = useState<{ name: string; color: string }[]>([])

  useEffect(() => {
    if (!awareness) return

    const updateUsers = () => {
      const states = Array.from(awareness.getStates().values()) as any[]
      const users = states
        .filter((state) => state.user && state.user.name)
        .map((state) => ({
          name: state.user.name,
          color: state.user.color || '#8b5cf6'
        }))
      // Filter out duplicate users in the same editor
      const uniqueUsers = users.filter((u, index, self) =>
        self.findIndex((t) => t.name === u.name) === index
      )
      setActiveUsers(uniqueUsers)
    }

    awareness.on('change', updateUsers)
    updateUsers()

    return () => {
      awareness.off('change', updateUsers)
    }
  }, [awareness])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false
      } as any),
      ...(doc && awareness
        ? [
            Collaboration.configure({
              document: doc,
              field: questionId
            }),
            CollaborationCursor.configure({
              provider: { awareness },
              user: {
                name: studentName,
                color: color
              }
            })
          ]
        : [])
    ],
    content: starterCode,
    editorProps: {
      attributes: {
        class:
          `min-h-[150px] p-3 w-full bg-background focus:outline-none prose prose-sm dark:prose-invert max-w-none ${
            kind === 'code' ? 'font-mono text-xs whitespace-pre-wrap' : ''
          }`,
        spellcheck: kind === 'code' ? 'false' : 'true'
      }
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText()
      onChange(text)
    }
  }, [doc, awareness, questionId, kind, starterCode])

  if (!editor) {
    return <p className="text-xs text-muted-foreground animate-pulse">Carregando editor colaborativo...</p>
  }

  return (
    <div className="relative bg-muted/40 dark:bg-muted/10 border border-border/60 rounded-xl overflow-hidden p-4 md:p-6 flex flex-col gap-4">
      {/* Canvas Header (Collaborators list + Online status indicator) */}
      <div className="flex items-center justify-between gap-4 select-none">
        {/* Status Indicator */}
        <div className="flex items-center gap-2 bg-background/80 backdrop-blur-xs border border-border/40 rounded-full px-3 py-1 shadow-2xs">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Modo Colaborativo
          </span>
        </div>

        {/* Collaborators Avatars */}
        {activeUsers.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden bg-background/80 backdrop-blur-xs border border-border/40 rounded-full p-0.5 shadow-2xs">
            {activeUsers.map((u, i) => {
              const initials = u.name.split(' ').map((n) => n[0]).slice(0, 2).join('')
              return (
                <div
                  key={i}
                  className="inline-flex size-6 rounded-full ring-2 ring-background flex items-center justify-center text-[10px] font-extrabold text-white uppercase select-none transition-all hover:scale-125 hover:z-10 cursor-help"
                  style={{ backgroundColor: u.color }}
                  title={u.name}
                >
                  {initials}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Canvas Document Sheet wrapper */}
      <div className="w-full flex-1 flex flex-col items-center">
        {/* The Page Sheet */}
        <div className="w-full max-w-2xl bg-card border border-border/80 rounded-lg shadow-xs focus-within:shadow-md focus-within:border-primary/50 transition-all duration-250 overflow-hidden flex flex-col">
          
          {/* Editor Toolbar (anchored inside the document sheet at the top) */}
          <div className="flex items-center gap-1 px-4 py-2 border-b border-border bg-muted/20 shrink-0 select-none">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`size-8 rounded-md transition-colors ${editor.isActive('bold') ? 'bg-background text-primary border border-border/40 shadow-2xs font-bold' : 'text-muted-foreground hover:bg-muted/50'}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Negrito (Ctrl+B)"
            >
              <Bold className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`size-8 rounded-md transition-colors ${editor.isActive('italic') ? 'bg-background text-primary border border-border/40 shadow-2xs' : 'text-muted-foreground hover:bg-muted/50'}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Itálico (Ctrl+I)"
            >
              <Italic className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`size-8 rounded-md transition-colors ${editor.isActive('code') ? 'bg-background text-primary border border-border/40 shadow-2xs' : 'text-muted-foreground hover:bg-muted/50'}`}
              onClick={() => editor.chain().focus().toggleCode().run()}
              title="Código em linha (Ctrl+E)"
            >
              <Code className="size-4" />
            </Button>
          </div>

          {/* Paper Editor Page Body */}
          <div className="p-6 md:p-8 min-h-[180px] w-full text-foreground">
            <EditorContent editor={editor} disabled={disabled} />
          </div>
        </div>
      </div>
    </div>
  )
}

