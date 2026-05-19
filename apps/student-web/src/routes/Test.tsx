import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import type { StudentQuestion } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Textarea } from '@/components/ui/textarea'
import { api } from '../lib/api'
import { clearToken, loadToken } from '../lib/session'
import { connectStudentWs } from '../lib/ws'

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function TestRoute(): React.JSX.Element {
  const navigate = useNavigate()
  const qc = useQueryClient()

  useEffect(() => {
    if (!loadToken()) navigate('/', { replace: true })
  }, [navigate])

  const examQuery = useQuery({
    queryKey: ['exam', 'current'],
    queryFn: api.exam,
    retry: false
  })

  const meQuery = useQuery({
    queryKey: ['session', 'me'],
    queryFn: api.me,
    retry: false
  })

  // Local draft of every answer, keyed by question id. Server is authoritative
  // on save; the local map exists so the form stays responsive.
  const [drafts, setDrafts] = useState<Record<string, string>>({})

  // Seed drafts once from the server-saved answers (handles refresh-mid-test).
  useEffect(() => {
    if (!meQuery.data) return
    setDrafts((cur) => {
      const next: Record<string, string> = { ...cur }
      for (const a of meQuery.data.answers) {
        if (next[a.questionId] === undefined) next[a.questionId] = a.value
      }
      return next
    })
  }, [meQuery.data?.studentId])

  // Server status → redirect.
  useEffect(() => {
    if (meQuery.data?.submittedAt) navigate('/done', { replace: true })
    if (meQuery.data?.status === 'ended') navigate('/done', { replace: true })
    if (meQuery.error) {
      const status = (meQuery.error as Error & { status?: number }).status
      if (status === 401) {
        clearToken()
        navigate('/', { replace: true })
      }
    }
  }, [meQuery.data, meQuery.error, navigate])

  // WS for session.ended / session.started edge cases.
  useEffect(() => {
    const token = loadToken()
    if (!token) return
    const conn = connectStudentWs({
      token,
      onEvent: (event) => {
        if (event.type === 'session.ended') navigate('/done', { replace: true })
        if (event.type === 'session.started') {
          qc.invalidateQueries({ queryKey: ['exam', 'current'] })
          qc.invalidateQueries({ queryKey: ['session', 'me'] })
        }
      }
    })
    return () => conn.close()
  }, [navigate, qc])

  // Heartbeat every 10s.
  useEffect(() => {
    const interval = setInterval(() => {
      void api.heartbeat().catch(() => {})
    }, 10_000)
    return () => clearInterval(interval)
  }, [])

  // Countdown.
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

  // Debounced save per question.
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const updateDraft = (questionId: string, value: string): void => {
    setDrafts((cur) => ({ ...cur, [questionId]: value }))
    if (debounceRefs.current[questionId]) {
      clearTimeout(debounceRefs.current[questionId])
    }
    debounceRefs.current[questionId] = setTimeout(() => {
      answerMutation.mutate({ questionId, value })
    }, 500)
  }

  const submitMutation = useMutation({
    mutationFn: () => api.submit(),
    onSuccess: () => navigate('/done', { replace: true })
  })

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
    <main className="bg-background min-h-screen pb-32">
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
          />
        ))}
      </ol>

      <div className="border-border bg-background/95 fixed bottom-0 left-0 right-0 border-t backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <p className="text-muted-foreground text-xs">
            {answerMutation.isPending ? 'Salvando…' : 'Auto-save ligado'}
          </p>
          <Button
            onClick={() => {
              if (confirm('Enviar prova? Você não poderá alterar as respostas depois.')) {
                submitMutation.mutate()
              }
            }}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? 'Enviando…' : 'Enviar prova'}
          </Button>
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
}

function QuestionCard({ index, question, value, onChange }: QuestionCardProps): React.JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {index}. {question.prompt}
        </CardTitle>
        <CardDescription>
          {question.kind === 'mcq' ? 'Múltipla escolha' : 'Dissertativa'}
        </CardDescription>
      </CardHeader>
      <CardContent>
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
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={5}
            placeholder="Escreva sua resposta…"
          />
        )}
      </CardContent>
    </Card>
  )
}
