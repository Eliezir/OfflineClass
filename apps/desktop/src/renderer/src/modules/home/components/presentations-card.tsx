import { Calendar, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { Card, CardContent } from '@renderer/shared/ui/card'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { cn } from '@renderer/shared/utils'
import emptyPresentations from '@renderer/shared/assets/empty-presentations.svg'
import { SectionHeader } from './section-header'
import { cardFill, PREVIEW, toneChip } from '../constants'
import type { Presentation, Tone } from '../types'

function PresentationThumb({ tone }: { tone: Tone }): React.JSX.Element {
  return (
    <div
      className={cn(
        'flex aspect-[4/3] w-16 shrink-0 animate-in flex-col justify-center gap-1 rounded-md p-2.5 fade-in-0 duration-500',
        toneChip[tone]
      )}
    >
      <span className="h-1 w-3/4 rounded-full bg-current" />
      <span className="h-1 w-full rounded-full bg-current opacity-40" />
      <span className="h-1 w-2/3 rounded-full bg-current opacity-40" />
    </div>
  )
}

function PresentationRow({ item }: { item: Presentation }): React.JSX.Element {
  return (
    <Link
      to="/projects"
      className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5 transition-colors hover:border-ring/40 hover:bg-muted/60"
    >
      <PresentationThumb tone={item.tone} />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
        <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
          <Calendar className="size-3" />
          {item.subject} · {item.modifiedAt}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold',
          toneChip[item.tone]
        )}
      >
        {item.visualModel}
      </span>
    </Link>
  )
}

function PresentationRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2.5">
      <Skeleton className="aspect-[4/3] w-16 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
    </div>
  )
}

export function PresentationsCard({
  items,
  loading = false,
  className
}: {
  items: Presentation[]
  loading?: boolean
  className?: string
}): React.JSX.Element {
  const { t } = useLingui()
  return (
    <Card interactive={false} className={cn(cardFill, className)}>
      <SectionHeader
        title={t`Apresentações`}
        to="/projects"
        count={loading ? undefined : items.length}
      />
      <CardContent className="scrollbar-minimal flex min-h-0 flex-1 flex-col overflow-y-auto">
        {loading ? (
          <ul className="space-y-2.5">
            {Array.from({ length: PREVIEW.presentations }, (_, i) => (
              <li key={i}>
                <PresentationRowSkeleton />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyState
            illustration={
              <img
                src={emptyPresentations}
                alt=""
                aria-hidden
                className="h-full w-full animate-in select-none object-contain fade-in-0 duration-500"
                draggable={false}
              />
            }
            illustrationClassName="max-h-72"
            title={t`Sua biblioteca está vazia`}
            description={
              <Trans>
                Você ainda não criou nenhuma apresentação. Escolha um template ou comece do zero com
                a IA.
              </Trans>
            }
            action={
              <Button asChild size="sm">
                <Link to="/projects">
                  <Sparkles />
                  <Trans>Criar apresentação</Trans>
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {items.slice(0, PREVIEW.presentations).map((p) => (
              <li key={p.id}>
                <PresentationRow item={p} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
