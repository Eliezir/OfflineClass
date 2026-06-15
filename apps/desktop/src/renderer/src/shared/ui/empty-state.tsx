import * as React from 'react'

import { cn } from '@renderer/shared/utils'

type EmptyStateProps = {
  illustration?: React.ReactNode
  icon?: React.ReactNode
  /** Small kicker pill shown above the title (full-page / glow contexts). */
  eyebrow?: React.ReactNode
  title: string
  description?: React.ReactNode
  action?: React.ReactNode
  /** Extra content rendered below the actions — e.g. a steps row. */
  footer?: React.ReactNode
  compact?: boolean
  /** Hero treatment for full-page empty states: soft brand glow + larger type. */
  glow?: boolean
  illustrationClassName?: string
  className?: string
}

export function EmptyState({
  illustration,
  icon,
  eyebrow,
  title,
  description,
  action,
  footer,
  compact = false,
  glow = false,
  illustrationClassName,
  className
}: EmptyStateProps): React.JSX.Element {
  return (
    <div
      className={cn(
        'relative isolate flex flex-1 flex-col items-center justify-center text-center',
        compact ? 'gap-3 px-4 py-8' : glow ? 'gap-6 px-6 py-6' : 'gap-4 px-6 py-6',
        className
      )}
    >
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -z-10 size-[36rem] max-w-full rounded-full bg-primary/10 blur-[120px]"
        />
      ) : null}

      {illustration ? (
        <div
          className={cn(
            'flex w-full items-center justify-center',
            compact ? 'h-20' : glow ? 'mx-auto h-80 max-w-sm' : 'min-h-0 flex-1',
            illustrationClassName
          )}
        >
          {illustration}
        </div>
      ) : icon ? (
        <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary-soft-foreground">
          {icon}
        </span>
      ) : null}

      <div
        className={cn(glow ? 'space-y-2' : 'space-y-1.5', compact ? 'max-w-[16rem]' : 'max-w-sm')}
      >
        {eyebrow ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 font-mono text-[0.65rem] font-semibold tracking-wider text-primary-soft-foreground uppercase">
            <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
            {eyebrow}
          </span>
        ) : null}
        <h3
          className={cn(
            'font-display font-semibold tracking-tight text-foreground',
            compact
              ? 'text-sm'
              : glow
                ? 'flex min-h-[3.75rem] flex-col items-center justify-center text-balance text-2xl leading-tight'
                : 'text-base'
          )}
        >
          {title}
        </h3>
        {description ? (
          <p
            className={cn(
              'text-balance leading-relaxed text-muted-foreground',
              compact ? 'text-xs' : 'text-sm',
              glow ? 'flex min-h-[4.5rem] flex-col items-center justify-center' : ''
            )}
          >
            {description}
          </p>
        ) : null}
      </div>

      {action ? (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-1">{action}</div>
      ) : null}

      {footer}
    </div>
  )
}
