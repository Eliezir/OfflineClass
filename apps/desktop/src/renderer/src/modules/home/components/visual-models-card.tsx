import { Plus } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { Card, CardContent } from '@renderer/shared/ui/card'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { cn } from '@renderer/shared/utils'
import emptyVisualModels from '@renderer/shared/assets/empty-visual-models.svg'
import { SectionHeader } from './section-header'
import { ModelCard } from './model-card'
import { cardFill, PREVIEW } from '../constants'
import { placeholderVisualModel } from '../mock-data'
import type { VisualModel } from '../types'

const GALLERY_GRID = 'grid grid-cols-1 gap-4 @md:grid-cols-2 @2xl:grid-cols-3'

/** Mirrors ModelCard's geometry so loading matches the filled/empty height. */
function ModelCardSkeleton(): React.JSX.Element {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="space-y-2 p-3.5 pb-2.5">
        <div className="flex h-6 items-center">
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-[18px] w-24 rounded-md" />
      </div>
      <div className="flex items-center justify-between px-3.5 pb-3.5">
        <Skeleton className="h-6 w-11 rounded-md" />
        <Skeleton className="h-6 w-16 rounded-md" />
      </div>
    </div>
  )
}

export function VisualModelsCard({
  items,
  loading = false,
  className
}: {
  items: VisualModel[]
  loading?: boolean
  className?: string
}): React.JSX.Element {
  const { t } = useLingui()
  return (
    <Card interactive={false} className={cn(cardFill, className)}>
      <SectionHeader title={t`Temas`} to="/themes" count={loading ? undefined : items.length} />
      <CardContent className="@container flex flex-1 flex-col">
        {loading ? (
          <div className={GALLERY_GRID}>
            {Array.from({ length: PREVIEW.visualModels }, (_, i) => (
              <ModelCardSkeleton key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          // Reserve the full grid (same cells as filled/loading) so the empty
          // state is exactly the same size at any width, then center the message.
          <div className={cn('relative', GALLERY_GRID)}>
            {Array.from({ length: PREVIEW.visualModels }, (_, i) => (
              <div key={i} className="invisible" aria-hidden>
                <ModelCard model={placeholderVisualModel} />
              </div>
            ))}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 py-3 text-center">
              <img
                src={emptyVisualModels}
                alt=""
                aria-hidden
                draggable={false}
                className="h-28 w-auto max-w-full animate-in select-none object-contain fade-in-0 duration-500"
              />
              <div className="space-y-0.5">
                <h3 className="font-display text-sm font-semibold tracking-tight text-foreground">
                  <Trans>Nenhum tema ainda</Trans>
                </h3>
                <p className="text-xs text-muted-foreground">
                  <Trans>Você ainda não criou nenhum tema próprio.</Trans>
                </p>
              </div>
              <Button asChild size="sm" variant="secondary">
                <Link to="/themes">
                  <Plus />
                  <Trans>Novo tema</Trans>
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className={GALLERY_GRID}>
            {items.slice(0, PREVIEW.visualModels).map((m) => (
              <ModelCard key={m.id} model={m} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
