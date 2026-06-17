import { Check, X } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import type { GradedAnswer } from '../types'
import { GradeInput } from './grade-input'

type GradedAnswerRowProps = {
  index: number
  answer: GradedAnswer
  onGrade: (score: number) => void
}

export function GradedAnswerRow({
  index,
  answer,
  onGrade
}: GradedAnswerRowProps): React.JSX.Element {
  const { question, value, points, awarded } = answer
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
    </article>
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
