import { BookOpen, Palette, Presentation } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Card, CardContent, CardHeader, CardTitle } from '@renderer/shared/ui/card'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { cn } from '@renderer/shared/utils'
import { cardFill, toneChip } from '../constants'
import type { Tone } from '../types'

function StatRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-10" />
      </div>
      <Skeleton className="size-10 rounded-xl" />
    </div>
  )
}

function StatRow({
  label,
  value,
  icon,
  tone
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: Tone
}): React.JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-4">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-3xl font-bold leading-none tracking-tight tabular-nums">
          {value}
        </p>
      </div>
      <span className={cn('grid size-10 place-items-center rounded-xl', toneChip[tone])}>
        {icon}
      </span>
    </div>
  )
}

export function SummaryCard({
  presentations,
  slideModels,
  visualModels,
  loading = false,
  className
}: {
  presentations: number
  slideModels: number
  visualModels: number
  loading?: boolean
  className?: string
}): React.JSX.Element {
  const { t } = useLingui()
  return (
    <Card interactive={false} className={cn(cardFill, className)}>
      <CardHeader>
        <CardTitle>
          <Trans>Resumo</Trans>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <>
            <StatRowSkeleton />
            <StatRowSkeleton />
            <StatRowSkeleton />
          </>
        ) : (
          <>
            <StatRow
              label={t`Apresentações`}
              value={presentations}
              icon={<BookOpen className="size-4" />}
              tone="primary"
            />
            <StatRow
              label={t`Modelos de Slides`}
              value={slideModels}
              icon={<Presentation className="size-4" />}
              tone="quaternary"
            />
            <StatRow
              label={t`Temas`}
              value={visualModels}
              icon={<Palette className="size-4" />}
              tone="tertiary"
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
