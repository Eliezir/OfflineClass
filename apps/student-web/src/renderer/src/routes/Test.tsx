import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { StudentQuestion } from '@offlineclass/shared'
import * as Y from 'yjs'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCaret from '@tiptap/extension-collaboration-caret'
import { Awareness } from 'y-protocols/awareness'
import * as awarenessProtocol from 'y-protocols/awareness'

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

  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  // Create Yjs Doc and shared map
  const doc = useMemo(() => new Y.Doc(), [])
  const answersMap = useMemo(() => doc.getMap<string>('answers'), [doc])
  const awareness = useMemo(() => new Awareness(doc), [doc])

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
          Y.applyUpdate(doc, payload, 'socket')
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
      doc.on('update', onDocUpdate)

      // Set initial local awareness state
      awareness.setLocalStateField('user', {
        name: meQuery.data?.studentName ?? 'User',
        color: ['#f43f5e', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6', '#6366f1', '#3b82f6', '#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e'][doc.clientID % 12]
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
      doc.off('update', onDocUpdate)
      conn.close()
    }
  }, [navigate, qc, teacherUrl, doc, awareness, meQuery.data?.groupMode, meQuery.data?.studentName])

  // Observe Yjs document changes and update react-state drafts
  useEffect(() => {
    if (!meQuery.data || meQuery.data.groupMode === 'disabled') return

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
    if (meQuery.data?.groupMode && meQuery.data.groupMode !== 'disabled') {
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
      <main className="p-8">
        <p className="text-destructive text-sm">
          Erro ao carregar prova: {String(examQuery.error)}
        </p>
      </main>
    )
  }

  const exam = examQuery.data
  const answeredCount = Object.values(drafts).filter((v) => v.trim().length > 0).length

  return (
    <main className="flex flex-1 flex-col pb-32 overflow-y-auto">
      <div className="bg-background/95 border-border sticky top-0 z-10 border-b backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-widest">
              {meQuery.data?.studentName} · {meQuery.data?.studentMatricula}
            </p>
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
            doc={doc}
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
  doc: Y.Doc
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
  doc: Y.Doc
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

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false
      } as any),
      Collaboration.configure({
        document: doc,
        field: questionId
      }),
      CollaborationCaret.configure({
        provider: { awareness },
        user: {
          name: studentName,
          color: color
        }
      })
    ],
    content: starterCode,
    editorProps: {
      attributes: {
        class:
          `min-h-[150px] p-3 border rounded-md w-full bg-background focus:ring-1 focus:ring-ring focus:outline-none prose prose-sm dark:prose-invert max-w-none ${
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
    <div className="relative bg-background">
      <EditorContent editor={editor} disabled={disabled} />
    </div>
  )
}

