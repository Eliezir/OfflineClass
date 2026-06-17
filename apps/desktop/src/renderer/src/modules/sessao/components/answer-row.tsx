import { Check, Circle, X } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import type { McqOption, StudentAnswerReview } from '@offlineclass/shared'
import { cn } from '@renderer/shared/utils'

type AnswerRowProps = {
  index: number
  review: StudentAnswerReview
}

/** One question on the student detail page: prompt + the student's full answer.
    MCQ shows every alternative (chosen + correct marked); essays show full text. */
export function AnswerRow({ index, review }: AnswerRowProps): React.JSX.Element {
  const { question, value, correct } = review
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
        <QuestionStatus answered={answered} kind={question.kind} correct={correct} />
      </header>

      <p className="mt-3 text-sm font-semibold leading-snug">{question.prompt}</p>

      {!answered ? (
        <p className="mt-3 text-sm font-semibold text-muted-foreground italic">
          <Trans>Não respondida</Trans>
        </p>
      ) : question.kind === 'mcq' ? (
        <ul className="mt-3 space-y-1.5">
          {question.options.map((option) => (
            <OptionRow key={option.id} option={option} chosen={option.id === value} />
          ))}
        </ul>
      ) : (
        <div className="mt-3">
          <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
            {value}
          </p>
          <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
            {value.length} <Trans>caracteres</Trans>
          </p>
        </div>
      )}
    </article>
  )
}

function QuestionStatus({
  answered,
  kind,
  correct
}: {
  answered: boolean
  kind: 'mcq' | 'essay'
  correct: boolean | null
}): React.JSX.Element {
  if (!answered) {
    return (
      <span className="text-xs font-bold text-muted-foreground">
        <Trans>não respondida</Trans>
      </span>
    )
  }
  if (kind === 'essay') {
    return (
      <span className="text-xs font-bold text-primary">
        <Trans>respondida</Trans>
      </span>
    )
  }
  return correct ? (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
      <Check className="size-3.5" />
      <Trans>correta</Trans>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-destructive">
      <X className="size-3.5" />
      <Trans>incorreta</Trans>
    </span>
  )
}

function OptionRow({ option, chosen }: { option: McqOption; chosen: boolean }): React.JSX.Element {
  const correct = option.correct
  return (
    <li
      className={cn(
        'flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm',
        chosen ? 'border-border bg-muted/50' : 'border-transparent'
      )}
    >
      <Marker chosen={chosen} correct={correct} />
      <span className={cn('flex-1', chosen ? 'font-bold' : 'font-medium')}>{option.text}</span>
      {chosen && (
        <span className="shrink-0 text-[11px] font-bold text-muted-foreground">
          <Trans>escolha do aluno</Trans>
        </span>
      )}
      {correct && !chosen && (
        <span className="shrink-0 text-[11px] font-bold text-success">
          <Trans>resposta correta</Trans>
        </span>
      )}
    </li>
  )
}

function Marker({ chosen, correct }: { chosen: boolean; correct: boolean }): React.JSX.Element {
  if (chosen) {
    return (
      <span
        className={cn(
          'grid size-5 shrink-0 place-items-center rounded-full text-white [&_svg]:size-3.5',
          correct ? 'bg-success' : 'bg-destructive'
        )}
      >
        {correct ? <Check /> : <X />}
      </span>
    )
  }
  if (correct) {
    return (
      <span className="grid size-5 shrink-0 place-items-center rounded-full border-2 border-success text-success [&_svg]:size-3">
        <Check />
      </span>
    )
  }
  return <Circle className="size-5 shrink-0 text-muted-foreground/40" strokeWidth={1.5} />
}
