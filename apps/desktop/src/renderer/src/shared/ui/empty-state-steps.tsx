import * as React from 'react'

export type EmptyStateStep = {
  icon: React.ReactNode
  label: React.ReactNode
}

/**
 * Compact "how it works" row for empty states — icon tile + label, joined by
 * arrows. Pass it to <EmptyState footer={...} />.
 */
export function EmptyStateSteps({ steps }: { steps: EmptyStateStep[] }): React.JSX.Element {
  return (
    <ol className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-2 text-sm text-muted-foreground">
      {steps.map((step, i) => (
        <React.Fragment key={i}>
          {i > 0 ? (
            <span aria-hidden className="text-border select-none">
              →
            </span>
          ) : null}
          <li className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary-soft-foreground [&_svg]:size-4">
              {step.icon}
            </span>
            {step.label}
          </li>
        </React.Fragment>
      ))}
    </ol>
  )
}
