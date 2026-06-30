import type { LucideIcon } from 'lucide-react'
import { cn } from '@renderer/shared/utils'

/** A titled settings card. Rows inside are divided by hairlines. */
export function SettingsSection({
  icon: Icon,
  title,
  description,
  action,
  children
}: {
  icon: LucideIcon
  title: string
  description?: string
  /** Optional control rendered at the right of the header (e.g. a help button). */
  action?: React.ReactNode
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <section className="@container overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-[6px] bg-primary-soft text-primary">
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="divide-y divide-border/60">{children}</div>
    </section>
  )
}

/** One row: label + description on the left, a control on the right. Pass
    `layout="stack"` when the control is wide (e.g. a position picker). */
export function SettingRow({
  title,
  description,
  control,
  layout = 'inline',
  disabled
}: {
  title: React.ReactNode
  description?: React.ReactNode
  control: React.ReactNode
  layout?: 'inline' | 'stack'
  disabled?: boolean
}): React.JSX.Element {
  return (
    <div
      className={cn(
        'px-5 py-3.5',
        layout === 'inline'
          ? 'flex flex-col gap-2.5 @sm:flex-row @sm:items-center @sm:justify-between @sm:gap-4'
          : 'space-y-3',
        disabled && 'opacity-60'
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">{title}</div>
        {description && (
          <p className="mt-0.5 text-xs text-pretty text-muted-foreground">{description}</p>
        )}
      </div>
      <div className={cn(layout === 'inline' && '@sm:shrink-0')}>{control}</div>
    </div>
  )
}
