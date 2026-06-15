import { cn } from '@renderer/shared/utils'

type Tone = 'primary' | 'secondary' | 'tertiary'

const TILE: Record<Tone, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  tertiary: 'bg-tertiary text-tertiary-foreground'
}

type StatCardProps = {
  tone: Tone
  icon: React.ReactNode
  value: React.ReactNode
  label: React.ReactNode
  /** Small context line under the label, e.g. "+3 esta semana". */
  hint?: React.ReactNode
}

export function StatCard({ tone, icon, value, label, hint }: StatCardProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <span
        className={cn(
          'grid size-11 shrink-0 place-items-center rounded-xl [&_svg]:size-5',
          TILE[tone]
        )}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="font-display text-2xl font-bold leading-none tracking-tight">{value}</div>
        <div className="mt-1 truncate text-xs font-bold text-muted-foreground">{label}</div>
        {hint && <div className="mt-1 truncate text-[11px] font-bold text-success">{hint}</div>}
      </div>
    </div>
  )
}
