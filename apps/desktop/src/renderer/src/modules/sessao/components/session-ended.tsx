import { ArrowRight, CheckCircle2, Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import type { SessionDetail } from '../types'

type SessionEndedProps = {
  session: SessionDetail
  /** Return the screen to the entry state to open a fresh session. */
  onNew: () => void
}

/** Ended state: summary + handoff to Resultados. */
export function SessionEnded({ session, onNew }: SessionEndedProps): React.JSX.Element {
  const total = session.students.length
  const submitted = session.students.filter((s) => s.submittedAt !== null).length

  return (
    <div className="relative isolate flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -z-10 size-[32rem] max-w-full rounded-full bg-secondary/10 blur-[120px]"
      />

      <span className="grid size-12 place-items-center rounded-2xl bg-secondary-soft text-secondary-soft-foreground [&_svg]:size-6">
        <CheckCircle2 />
      </span>
      <h2 className="mt-4 font-display text-2xl font-bold tracking-tight">
        <Trans>Sessão encerrada</Trans>
      </h2>
      <p className="mt-1.5 text-sm font-semibold text-muted-foreground">{session.examTitle}</p>

      <div className="mt-6 flex flex-wrap items-stretch justify-center gap-3">
        <Summary value={total} label={<Trans>alunos</Trans>} />
        <Summary value={submitted} label={<Trans>entregaram</Trans>} />
        <Summary value={`${session.durationMinutes} min`} label={<Trans>duração</Trans>} />
      </div>

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
        <Button asChild>
          <Link to="/resultados">
            <Trans>Ver resultados</Trans>
            <ArrowRight />
          </Link>
        </Button>
        <Button variant="outline" onClick={onNew}>
          <Plus />
          <Trans>Nova sessão</Trans>
        </Button>
      </div>
    </div>
  )
}

function Summary({
  value,
  label
}: {
  value: React.ReactNode
  label: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="min-w-28 rounded-2xl border border-border bg-card px-5 py-3 text-center">
      <div className="font-display text-2xl font-bold leading-none tracking-tight">{value}</div>
      <div className="mt-1 text-xs font-bold text-muted-foreground">{label}</div>
    </div>
  )
}
