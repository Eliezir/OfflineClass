import { ListChecks, Trophy } from 'lucide-react'
import { Trans } from '@lingui/react/macro'

type BuilderSummaryProps = {
  questions: number
  points: number
}

/** Live totals for the prova being built, shown at the top of the builder sidebar. */
export function BuilderSummary({ questions, points }: BuilderSummaryProps): React.JSX.Element {
  const rounded = Math.round(points * 100) / 100
  return (
    <div className="grid grid-cols-2 gap-2">
      <Stat icon={<ListChecks />} value={questions} label={<Trans>Questões</Trans>} />
      <Stat icon={<Trophy />} value={rounded} label={<Trans>Pontos</Trans>} />
    </div>
  )
}

function Stat({
  icon,
  value,
  label
}: {
  icon: React.ReactNode
  value: number
  label: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <span className="grid size-7 place-items-center rounded-lg bg-primary-soft text-primary [&_svg]:size-4">
        {icon}
      </span>
      <div className="mt-2 text-xl font-bold leading-none tabular-nums">{value}</div>
      <div className="mt-1 text-xs font-semibold text-muted-foreground">{label}</div>
    </div>
  )
}
