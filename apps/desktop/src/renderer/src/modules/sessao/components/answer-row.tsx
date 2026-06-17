import { useState } from 'react'
import { Check, Circle, X, Award } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import type { McqOption, StudentAnswerReview } from '@offlineclass/shared'
import { cn } from '@renderer/shared/utils'
import { useGradeAnswerMutation } from '../queries'

type AnswerRowProps = {
  index: number
  review: StudentAnswerReview
  sessionId: string
  studentId: string
}

/** One question on the student detail page: prompt + the student's full answer.
    MCQ shows every alternative (chosen + correct marked); essays show full text. */
export function AnswerRow({
  index,
  review,
  sessionId,
  studentId
}: AnswerRowProps): React.JSX.Element {
  const { question, value, correct, score } = review
  const answered = value !== null

  // Tracks the last score received from the backend to safely watch for external updates
  const [prevScore, setPrevScore] = useState<number | null>(score)
  const [localScore, setLocalScore] = useState<string>(score !== null ? String(score) : '')

  // Safe inline state synchronization during render phase (avoids useEffect cascading renders)
  if (score !== prevScore) {
    setPrevScore(score)
    setLocalScore(score !== null ? String(score) : '')
  }

  const gradeMutation = useGradeAnswerMutation(sessionId, studentId)

  function handleBlurScore(): void {
    const parsed = localScore === '' ? null : Number(localScore)

    // Guard constraints: score must be a number between 0 and 1, or null
    if (parsed !== null && (isNaN(parsed) || parsed < 0 || parsed > 1)) return

    gradeMutation.mutate({ questionId: question.id, score: parsed })
  }

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
        <QuestionStatus answered={answered} kind={question.kind} correct={correct} score={score} />
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
        <div className="mt-3 space-y-4">
          <div>
            <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {value}
            </p>
            <p className="mt-1.5 text-xs font-semibold text-muted-foreground">
              {value.length} <Trans>caracteres</Trans>
            </p>
          </div>

          {/* Teacher Manual Grading Suite Panel */}
          <div className="flex items-center gap-3 border-t border-border/50 pt-4">
            <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Award className="size-4 text-primary" />
              <Trans>Atribuir nota (0.0 a 1.0):</Trans>
            </span>
            <input
              type="number"
              min="0"
              max="1"
              step="0.1"
              disabled={gradeMutation.isPending}
              value={localScore}
              onChange={(e) => setLocalScore(e.target.value)}
              onBlur={handleBlurScore}
              className="w-20 rounded-xl border border-border bg-muted/50 px-3 py-1.5 text-center text-sm font-bold text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
              placeholder="null"
            />
            {gradeMutation.isPending && (
              <span className="text-xs text-muted-foreground animate-pulse">
                <Trans>Salvando...</Trans>
              </span>
            )}
          </div>
        </div>
      )}
    </article>
  )
}

function QuestionStatus({
  answered,
  kind,
  correct,
  score
}: {
  answered: boolean
  kind: 'mcq' | 'essay'
  correct: boolean | null
  score: number | null
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
      <span className={cn('text-xs font-bold', score !== null ? 'text-success' : 'text-primary')}>
        {score !== null ? (
          <Trans>avaliada ({score.toFixed(1)})</Trans>
        ) : (
          <Trans>pendente de nota</Trans>
        )}
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
