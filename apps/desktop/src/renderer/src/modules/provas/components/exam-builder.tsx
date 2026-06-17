import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useIsMutating } from '@tanstack/react-query'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable'
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ClipboardList,
  ListChecks,
  Loader2,
  Pencil
} from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import type { ExamSummary, QuestionInput, QuestionKind } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { notify } from '@renderer/shared/services/toast'
import { useAddQuestion, useDeleteQuestion, useExamQuery, useReorderQuestions } from '../queries'
import { BuilderFinishDialog } from './builder-finish-dialog'
import { BuilderSummary } from './builder-summary'
import { ProvaFormDialog } from './prova-form-dialog'
import { QuestionBlock } from './question-block'
import { QuestionPalette } from './question-palette'

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

function defaultQuestion(
  kind: QuestionKind,
  untitled: string,
  optionLabel: (n: number) => string
): QuestionInput {
  const base = { prompt: untitled, points: 1, image: null }
  const starterOptions = (
    firstCorrect: boolean
  ): { id: string; text: string; correct: boolean }[] => [
    { id: crypto.randomUUID(), text: optionLabel(1), correct: firstCorrect },
    { id: crypto.randomUUID(), text: optionLabel(2), correct: false }
  ]
  switch (kind) {
    case 'mcq':
      return { kind: 'mcq', ...base, options: starterOptions(true) }
    case 'multi':
      return { kind: 'multi', ...base, options: starterOptions(true) }
    case 'truefalse':
      return { kind: 'truefalse', ...base, answer: true }
    case 'code':
      return { kind: 'code', ...base, language: 'plaintext', starterCode: '' }
    default:
      return { kind: 'essay', ...base }
  }
}

export function ExamBuilder({ examId }: { examId: string }): React.JSX.Element {
  const { t } = useLingui()
  const navigate = useNavigate()
  const { data: exam, isLoading, isError } = useExamQuery(examId)

  const add = useAddQuestion(examId)
  const del = useDeleteQuestion(examId)
  const reorder = useReorderQuestions(examId)
  // Any in-flight question/exam write → "Salvando…" in the header.
  const saving = useIsMutating() > 0

  const [metaOpen, setMetaOpen] = useState(false)
  const [finishOpen, setFinishOpen] = useState(false)

  const handleFinish = (): void => {
    setFinishOpen(false)
    notify.success(t`Prova salva`)
    void navigate({ to: '/provas' })
  }
  const handleStartSession = (): void => {
    setFinishOpen(false)
    void navigate({ to: '/sessao', search: { examId } })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const addQuestion = (kind: QuestionKind): void => {
    add.mutate(defaultQuestion(kind, t`Pergunta sem título`, (n) => t`Alternativa ${n}`))
  }

  const onDragEnd = (event: DragEndEvent): void => {
    const { active, over } = event
    if (!over || active.id === over.id || !exam) return
    const ids = exam.questions.map((q) => q.id)
    const from = ids.indexOf(String(active.id))
    const to = ids.indexOf(String(over.id))
    if (from === -1 || to === -1) return
    reorder.mutate(arrayMove(ids, from, to))
  }

  if (isLoading) {
    return (
      <main className="flex flex-1 flex-col px-6 pb-6">
        <div className="pt-6">
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="mx-auto mt-6 w-full max-w-2xl space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      </main>
    )
  }

  if (isError || !exam) {
    return (
      <main className="flex flex-1 flex-col px-6 pb-6">
        <EmptyState
          icon={<ClipboardList />}
          title={t`Prova não encontrada`}
          description={<Trans>Ela pode ter sido excluída.</Trans>}
          action={
            <Button asChild>
              <Link to="/provas">
                <ArrowLeft />
                <Trans>Voltar para Provas</Trans>
              </Link>
            </Button>
          }
        />
      </main>
    )
  }

  const totalPoints = exam.questions.reduce((acc, q) => acc + q.points, 0)
  const subtitleParts = [exam.subject, exam.gradeLevel].filter(Boolean)

  const summary: ExamSummary = {
    id: exam.id,
    title: exam.title,
    description: exam.description,
    subject: exam.subject,
    gradeLevel: exam.gradeLevel,
    icon: exam.icon,
    questionsCount: exam.questions.length,
    createdAt: exam.createdAt,
    updatedAt: exam.updatedAt
  }

  // Soft readiness warnings shown in the "Concluir" dialog (they don't block).
  const warnings: string[] = []
  if (exam.questions.length === 0) {
    warnings.push(t`Adicione ao menos uma questão antes de aplicar.`)
  }
  const untitled = exam.questions.filter((q) => q.prompt.trim() === t`Pergunta sem título`).length
  if (untitled === 1) warnings.push(t`1 questão ainda está com o título padrão.`)
  else if (untitled > 1) warnings.push(t`${untitled} questões ainda estão com o título padrão.`)

  return (
    <div className="flex flex-1 overflow-hidden">
      <main className="scrollbar-subtle flex-1 overflow-y-auto px-6 pb-10">
        <header className="mb-6 pt-6" style={dragRegion}>
          <div style={noDragRegion} className="w-fit">
            <Link
              to="/provas"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              <Trans>Provas</Trans>
            </Link>
          </div>
          <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary-soft text-2xl text-primary [&_svg]:size-6">
                {exam.icon ? exam.icon : <ClipboardList />}
              </span>
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight">{exam.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {subtitleParts.length > 0 && <>{subtitleParts.join(' · ')} · </>}
                  {exam.questions.length} <Trans>questões</Trans> · {totalPoints}{' '}
                  {totalPoints === 1 ? t`ponto` : t`pontos`}
                </p>
              </div>
            </div>
            <div style={noDragRegion} className="flex items-center gap-2">
              <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                {saving ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <Trans>Salvando…</Trans>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-3.5 text-success" />
                    <Trans>Salvo automaticamente</Trans>
                  </>
                )}
              </span>
              <Button variant="outline" onClick={() => setMetaOpen(true)}>
                <Pencil />
                <Trans>Editar dados</Trans>
              </Button>
              <Button onClick={() => setFinishOpen(true)}>
                <Check />
                <Trans>Concluir</Trans>
              </Button>
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-2xl">
          {exam.questions.length === 0 ? (
            <EmptyState
              icon={<ListChecks />}
              title={t`Nenhuma questão ainda`}
              description={<Trans>Use o painel à direita para adicionar a primeira questão.</Trans>}
            />
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext
                items={exam.questions.map((q) => q.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {exam.questions.map((q, i) => (
                    <QuestionBlock
                      key={q.id}
                      examId={examId}
                      question={q}
                      index={i}
                      onDelete={() => del.mutate(q.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </main>

      <aside
        className="scrollbar-subtle w-72 shrink-0 space-y-4 overflow-y-auto border-l border-border p-4"
        style={noDragRegion}
      >
        <BuilderSummary questions={exam.questions.length} points={totalPoints} />
        <QuestionPalette onAdd={addQuestion} disabled={add.isPending} />
      </aside>

      <ProvaFormDialog open={metaOpen} onOpenChange={setMetaOpen} prova={summary} />
      <BuilderFinishDialog
        open={finishOpen}
        onOpenChange={setFinishOpen}
        title={exam.title}
        icon={exam.icon}
        questionsCount={exam.questions.length}
        totalPoints={totalPoints}
        warnings={warnings}
        onFinish={handleFinish}
        onStartSession={handleStartSession}
      />
    </div>
  )
}
