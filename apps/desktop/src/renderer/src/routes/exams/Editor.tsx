import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import type { Question, QuestionInput } from '@offlineclass/shared'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { api } from '../../lib/api'
import EssayEditor from './EssayEditor'
import McqEditor from './McqEditor'

function previewOf(q: Question): string {
  const first = q.prompt.split('\n')[0]
  return first.length > 60 ? `${first.slice(0, 57)}…` : first
}

function newQuestionDraft(kind: 'mcq' | 'essay'): QuestionInput {
  if (kind === 'mcq') {
    return {
      kind: 'mcq',
      prompt: 'Nova questão',
      options: [
        { id: crypto.randomUUID(), text: 'Opção A', correct: true },
        { id: crypto.randomUUID(), text: 'Opção B', correct: false }
      ]
    }
  }
  return { kind: 'essay', prompt: 'Nova questão' }
}

export default function ExamEditorRoute(): React.JSX.Element {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data: exam, isPending, error } = useQuery({
    queryKey: ['exams', id],
    queryFn: () => api.exams.get(id),
    enabled: !!id
  })

  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Auto-select first question on first load.
  useEffect(() => {
    if (!selectedId && exam && exam.questions.length > 0) {
      setSelectedId(exam.questions[0].id)
    }
  }, [exam, selectedId])

  // Drop selection if the question was deleted.
  useEffect(() => {
    if (exam && selectedId && !exam.questions.some((q) => q.id === selectedId)) {
      setSelectedId(exam.questions[0]?.id ?? null)
    }
  }, [exam, selectedId])

  // Exam metadata editing.
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDesc, setDraftDesc] = useState('')
  useEffect(() => {
    if (exam) {
      setDraftTitle(exam.title)
      setDraftDesc(exam.description ?? '')
    }
  }, [exam?.id])
  const metaDirty = !!exam && (draftTitle !== exam.title || draftDesc !== (exam.description ?? ''))

  const updateExam = useMutation({
    mutationFn: () =>
      api.exams.update(id, { title: draftTitle, description: draftDesc || null }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams', id] })
  })

  const addQuestion = useMutation({
    mutationFn: (kind: 'mcq' | 'essay') => api.questions.add(id, newQuestionDraft(kind)),
    onSuccess: (q) => {
      setSelectedId(q.id)
      qc.invalidateQueries({ queryKey: ['exams', id] })
    }
  })

  const updateQuestion = useMutation({
    mutationFn: ({ qid, input }: { qid: string; input: QuestionInput }) =>
      api.questions.update(qid, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams', id] })
  })

  const deleteQuestion = useMutation({
    mutationFn: (qid: string) => api.questions.delete(qid),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams', id] })
  })

  const reorderQuestions = useMutation({
    mutationFn: (orderedIds: string[]) => api.questions.reorder(id, orderedIds),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exams', id] })
  })

  if (!id) {
    navigate('/exams', { replace: true })
    return <></>
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <p className="text-destructive">Erro ao carregar prova: {String(error)}</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to="/exams">Voltar</Link>
        </Button>
      </main>
    )
  }

  if (isPending || !exam) {
    return (
      <main className="mx-auto max-w-3xl p-10">
        <p className="text-muted-foreground text-sm">Carregando…</p>
      </main>
    )
  }

  const selected = exam.questions.find((q) => q.id === selectedId) ?? null

  const moveQuestion = (qid: string, delta: -1 | 1): void => {
    const order = exam.questions.map((q) => q.id)
    const idx = order.indexOf(qid)
    const target = idx + delta
    if (idx < 0 || target < 0 || target >= order.length) return
    const next = [...order]
    ;[next[idx], next[target]] = [next[target], next[idx]]
    reorderQuestions.mutate(next)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 p-8">
      <header className="space-y-1">
        <p className="text-muted-foreground text-xs tracking-widest uppercase">
          <Link to="/exams">← Provas</Link>
        </p>
        <h1 className="text-2xl font-semibold">Editor de prova</h1>
      </header>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="space-y-2">
            <Label htmlFor="exam-title">Título</Label>
            <Input
              id="exam-title"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="exam-desc">Descrição</Label>
            <Textarea
              id="exam-desc"
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end">
            <Button
              onClick={() => updateExam.mutate()}
              disabled={!metaDirty || updateExam.isPending}
            >
              {updateExam.isPending ? 'Salvando…' : 'Salvar dados da prova'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-[260px_1fr]">
        <aside className="space-y-2">
          <h2 className="text-muted-foreground text-xs tracking-widest uppercase">
            Questões ({exam.questions.length})
          </h2>
          <ol className="space-y-1">
            {exam.questions.map((q, idx) => (
              <li key={q.id}>
                <div
                  className={cn(
                    'group border-border bg-card hover:bg-muted/60 flex items-stretch gap-1 rounded-md border p-2 transition-colors',
                    selectedId === q.id && 'border-ring bg-muted/60'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(q.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <p className="text-muted-foreground text-xs">
                      {idx + 1}. {q.kind === 'mcq' ? 'Múltipla escolha' : 'Dissertativa'}
                    </p>
                    <p className="truncate text-sm">{previewOf(q)}</p>
                  </button>
                  <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Mover para cima"
                      disabled={idx === 0 || reorderQuestions.isPending}
                      onClick={() => moveQuestion(q.id, -1)}
                    >
                      <ChevronUp />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      aria-label="Mover para baixo"
                      disabled={idx === exam.questions.length - 1 || reorderQuestions.isPending}
                      onClick={() => moveQuestion(q.id, 1)}
                    >
                      <ChevronDown />
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Apagar"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => {
                      if (confirm('Apagar esta questão?')) deleteQuestion.mutate(q.id)
                    }}
                  >
                    <Trash2 />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full" disabled={addQuestion.isPending}>
                <Plus /> Adicionar questão
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => addQuestion.mutate('mcq')}>
                Múltipla escolha
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addQuestion.mutate('essay')}>
                Dissertativa
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </aside>

        <div>
          {selected ? (
            selected.kind === 'mcq' ? (
              <McqEditor
                key={selected.id}
                question={selected}
                onSave={(input) => updateQuestion.mutateAsync({ qid: selected.id, input })}
                isSaving={updateQuestion.isPending}
              />
            ) : (
              <EssayEditor
                key={selected.id}
                question={selected}
                onSave={(input) => updateQuestion.mutateAsync({ qid: selected.id, input })}
                isSaving={updateQuestion.isPending}
              />
            )
          ) : (
            <Card>
              <CardContent className="text-muted-foreground py-12 text-center text-sm">
                {exam.questions.length === 0
                  ? 'Adicione a primeira questão à esquerda.'
                  : 'Selecione uma questão à esquerda para editá-la.'}
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  )
}
