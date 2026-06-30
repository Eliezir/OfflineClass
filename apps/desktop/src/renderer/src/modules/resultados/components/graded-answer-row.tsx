import { useState } from 'react'
import { Check, MessageSquarePlus, X } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import type { GradedAnswer } from '../types'
import { GradeInput } from './grade-input'
import { CommentField } from './comment-field'

type GradedAnswerRowProps = {
  index: number
  answer: GradedAnswer
  onGrade: (score: number) => void
  onComment: (comment: string) => void | Promise<unknown>
}

/** Draft comment suggested for a wrong MCQ answer — the teacher edits/confirms. */
function mcqSuggestion(answer: GradedAnswer): string | undefined {
  const { question, value } = answer
  if (question.kind !== 'mcq' || value === null) return undefined
  const chosen = question.options.find((o) => o.id === value)
  if (chosen?.correct) return undefined
  const correct = question.options.find((o) => o.correct)
  if (!correct) return undefined
  return `A resposta correta é "${correct.text}".`
}

export function GradedAnswerRow({
  index,
  answer,
  onGrade,
  onComment
}: GradedAnswerRowProps): React.JSX.Element {
  const { question, value, points, awarded, feedback } = answer
  const answered = value !== null

  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">
            {index + 1}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold tracking-wide text-muted-foreground uppercase">
            {question.kind === 'mcq' ? (
              <Trans>Múltipla escolha</Trans>
            ) : (
              <Trans>Dissertativa</Trans>
            )}
          </span>
        </div>
        <ScoreBadge awarded={awarded} points={points} />
      </header>

      <p className="mt-3 text-sm font-semibold leading-snug">{question.prompt}</p>

      {!answered ? (
        <p className="mt-3 text-sm font-semibold text-muted-foreground italic">
          <Trans>Não respondida</Trans>
        </p>
      ) : question.kind === 'mcq' ? (
        <McqAnswer question={question} value={value} />
      ) : (
        <div className="mt-3 space-y-3">
          <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {value}
          </p>
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-muted-foreground">
              <Trans>Nota da questão</Trans>
            </span>
            <GradeInput value={awarded} max={points} onChange={onGrade} />
          </div>
        </div>
      )}

      <AnswerComment
        feedback={feedback}
        onComment={onComment}
        suggestion={mcqSuggestion(answer)}
      />
    </article>
  )
}

/** Collapsible per-answer feedback field. Saved on blur when it changed. */
function AnswerComment({
  feedback,
  onComment,
  suggestion
}: {
  feedback: string | null
  onComment: (comment: string) => void | Promise<unknown>
  suggestion?: string
}): React.JSX.Element {
  const { t } = useLingui()
  // Auto-open when there's already a comment or a suggestion to confirm.
  const [open, setOpen] = useState(feedback !== null || !!suggestion)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
      >
        <MessageSquarePlus className="size-3.5" />
        <Trans>Adicionar comentário</Trans>
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-1.5">
      <span className="text-xs font-bold text-muted-foreground">
        <Trans>Comentário para o aluno</Trans>
      </span>
      <CommentField
        value={feedback}
        onSave={onComment}
        initialDraft={suggestion}
        placeholder={t`Escreva um comentário sobre esta resposta…`}
        ariaLabel={t`Comentário para o aluno`}
      />
    </div>
  )
}

function ScoreBadge({
  awarded,
  points
}: {
  awarded: number | null
  points: number
}): React.JSX.Element {
  if (awarded === null) {
    return (
      <span className="rounded-full bg-tertiary-soft px-2.5 py-1 text-xs font-bold text-tertiary-soft-foreground">
        <Trans>a corrigir</Trans>
      </span>
    )
  }
  return (
    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground tabular-nums">
      {awarded}/{points} <Trans>pts</Trans>
    </span>
  )
}

function McqAnswer({
  question,
  value
}: {
  question: Extract<GradedAnswer['question'], { kind: 'mcq' }>
  value: string
}): React.JSX.Element {
  const chosen = question.options.find((o) => o.id === value)
  const correct = chosen?.correct === true
  const correctOption = question.options.find((o) => o.correct)

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            'grid size-5 shrink-0 place-items-center rounded-full text-white [&_svg]:size-3.5',
            correct ? 'bg-success' : 'bg-destructive'
          )}
        >
          {correct ? <Check /> : <X />}
        </span>
        <span className="text-sm font-bold">{chosen?.text ?? value}</span>
      </div>
      {!correct && correctOption && (
        <p className="pl-7 text-xs font-semibold text-muted-foreground">
          <Trans>Correta:</Trans> {correctOption.text}
        </p>
      )}
    </div>
  )
}
