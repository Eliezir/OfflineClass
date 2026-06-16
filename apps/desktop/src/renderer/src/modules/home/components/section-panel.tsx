import { cn } from '@renderer/shared/utils'

type SectionPanelProps = {
  title: React.ReactNode
  subtitle?: React.ReactNode
  /** Right-aligned header action, e.g. a "Ver todas" link. */
  action?: React.ReactNode
  /** Grow to fill available height on tall windows, scrolling the body. Also
      gives the body a min height so centered (empty/loading) content sits in
      real vertical space instead of hugging the top. */
  fill?: boolean
  children: React.ReactNode
}

/** Card panel with a title row + optional subtitle, used for the home sections
    ("Suas provas", "Resultados recentes"). */
export function SectionPanel({
  title,
  subtitle,
  action,
  fill,
  children
}: SectionPanelProps): React.JSX.Element {
  return (
    <section
      className={cn(
        'flex flex-col rounded-2xl border border-border bg-card p-4',
        fill && 'min-h-[320px] tall:min-h-0'
      )}
    >
      <div className="flex shrink-0 items-center justify-between gap-3">
        <h2 className="text-sm font-bold">{title}</h2>
        {action}
      </div>
      {subtitle && (
        <p className="mt-0.5 shrink-0 text-xs font-semibold text-muted-foreground">{subtitle}</p>
      )}
      <div
        className={cn(
          'mt-3',
          fill && 'scrollbar-subtle flex min-h-0 flex-1 flex-col overflow-y-auto pr-1'
        )}
      >
        {children}
      </div>
    </section>
  )
}
