import { ArrowUpRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { CardAction, CardHeader, CardTitle } from '@renderer/shared/ui/card'

export function SectionHeader({
  title,
  to,
  count,
  actionLabel
}: {
  title: string
  to: '/projects' | '/themes' | '/slides-models'
  count?: number
  actionLabel?: string
}): React.JSX.Element {
  const { t } = useLingui()
  const label = actionLabel ?? t`Ver tudo`
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {title}
        {count !== undefined && count > 0 ? (
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground tabular-nums">
            {count}
          </span>
        ) : null}
      </CardTitle>
      <CardAction>
        <Button asChild variant="ghost" size="xs" className="text-muted-foreground">
          <Link to={to}>
            {label}
            <ArrowUpRight />
          </Link>
        </Button>
      </CardAction>
    </CardHeader>
  )
}
