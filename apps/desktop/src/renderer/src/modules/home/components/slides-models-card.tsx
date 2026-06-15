import {
  Languages,
  ListChecks,
  Plus,
  StickyNote,
  SunMoon,
  Wand2,
  ZoomIn,
  type LucideIcon
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'
import { Button } from '@renderer/shared/ui/button'
import { Card, CardContent } from '@renderer/shared/ui/card'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/shared/ui/hover-card'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { cn } from '@renderer/shared/utils'
import emptySlidesModels from '@renderer/shared/assets/empty-slides-models.svg'
import { SectionHeader } from './section-header'
import { cardFill, PREVIEW, toneChip } from '../constants'
import type { SlideFeature, SlideModel, Tone } from '../types'

const FEATURE_META: Record<SlideFeature, { icon: LucideIcon; label: MessageDescriptor }> = {
  theme: { icon: SunMoon, label: msg`Alternar tema` },
  translation: { icon: Languages, label: msg`Tradução` },
  zoom: { icon: ZoomIn, label: msg`Zoom` },
  quiz: { icon: ListChecks, label: msg`Quizzes` },
  animations: { icon: Wand2, label: msg`Animações` },
  notes: { icon: StickyNote, label: msg`Notas do apresentador` }
}

const MAX_FEATURE_ICONS = 3

/** A back slide + a tone-colored front slide with mini content lines — the
 *  tone makes each model's deck visually distinct. */
function DeckThumb({ tone }: { tone: Tone }): React.JSX.Element {
  return (
    <span className="relative h-9 w-10 shrink-0" aria-hidden>
      <span className="absolute top-1 right-0 h-5 w-7 rounded-[3px] border border-border bg-card" />
      <span
        className={cn(
          'absolute bottom-1 left-0 flex h-5 w-7 flex-col justify-center gap-[2px] rounded-[3px] border border-border px-1',
          toneChip[tone]
        )}
      >
        <span className="h-[2px] w-3/4 rounded-full bg-current opacity-70" />
        <span className="h-[2px] w-1/2 rounded-full bg-current opacity-40" />
      </span>
    </span>
  )
}

function FeaturesHover({ features }: { features: SlideFeature[] }): React.JSX.Element | null {
  const { i18n } = useLingui()
  if (features.length === 0) return null
  const shown = features.slice(0, MAX_FEATURE_ICONS)
  const extra = features.length - shown.length
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/35"
        >
          {shown.map((f) => {
            const Icon = FEATURE_META[f].icon
            return <Icon key={f} className="size-3.5" />
          })}
          {extra > 0 ? <span className="font-mono text-[10px] font-medium">+{extra}</span> : null}
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-52 p-1.5">
        <div className="flex flex-col gap-0.5 px-2.5 pt-1.5 pb-2">
          <span className="text-sm font-semibold text-foreground">
            <Trans>Funcionalidades</Trans>
          </span>
        </div>
        <div className="space-y-0.5">
          {features.map((f) => {
            const Icon = FEATURE_META[f].icon
            return (
              <div key={f} className="flex items-center gap-2 rounded-lg px-2.5 py-1.5">
                <Icon className="size-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{i18n._(FEATURE_META[f].label)}</span>
              </div>
            )
          })}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

function SlideModelRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3">
      <Skeleton className="h-9 w-10 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-6 w-14 shrink-0 rounded-md" />
    </div>
  )
}

export function SlidesModelsCard({
  items,
  loading = false,
  className
}: {
  items: SlideModel[]
  loading?: boolean
  className?: string
}): React.JSX.Element {
  const { t } = useLingui()
  return (
    <Card interactive={false} className={cn(cardFill, className)}>
      <SectionHeader
        title={t`Modelos de Slides`}
        to="/slides-models"
        count={loading ? undefined : items.length}
      />
      <CardContent className="scrollbar-minimal flex min-h-0 flex-1 flex-col overflow-y-auto">
        {loading ? (
          <ul className="space-y-2.5">
            {Array.from({ length: PREVIEW.slideModels }, (_, i) => (
              <li key={i}>
                <SlideModelRowSkeleton />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyState
            illustration={
              <img
                src={emptySlidesModels}
                alt=""
                aria-hidden
                className="h-full w-full animate-in select-none object-contain fade-in-0 duration-500"
                draggable={false}
              />
            }
            illustrationClassName="max-h-44"
            title={t`Nenhum modelo de slides`}
            description={<Trans>Importe um modelo ou salve a partir de uma apresentação.</Trans>}
            action={
              <Button asChild size="sm" variant="secondary">
                <Link to="/slides-models">
                  <Plus />
                  <Trans>Adicionar modelo</Trans>
                </Link>
              </Button>
            }
          />
        ) : (
          <ul className="space-y-2.5">
            {items.slice(0, PREVIEW.slideModels).map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-3 transition-colors hover:border-ring/40 hover:bg-muted/60"
              >
                <Link to="/slides-models" className="flex min-w-0 flex-1 items-center gap-3">
                  <DeckThumb tone={m.tone} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.name}</p>
                    <p className="font-mono text-xs text-muted-foreground tabular-nums">
                      <Plural value={m.slides} one="# slide" other="# slides" />
                    </p>
                  </div>
                </Link>
                <FeaturesHover features={m.features} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
