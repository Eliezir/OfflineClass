import { Layers, Moon, Sun } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@renderer/shared/ui/hover-card'
import { cn } from '@renderer/shared/utils'
import type { VisualModel } from '../types'

const FONT_CLASS: Record<VisualModel['font'], string> = {
  sans: 'font-display',
  serif: 'font-serif',
  mono: 'font-mono'
}

function ModeBadge({ modes }: { modes: VisualModel['modes'] }): React.JSX.Element {
  const { t } = useLingui()
  const label = modes.map((m) => (m === 'light' ? t`claro` : t`escuro`)).join(t` e `)
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md border border-border px-1.5 py-1"
      title={t`Suporta tema ${label}`}
    >
      {modes.includes('light') ? <Sun className="size-3.5" /> : null}
      {modes.includes('dark') ? <Moon className="size-3.5" /> : null}
    </span>
  )
}

function AssetsHover({ assets }: { assets: VisualModel['assets'] }): React.JSX.Element {
  const total = assets.reduce((sum, a) => sum + a.count, 0)
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-1 outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/35"
        >
          <Layers className="size-3.5" />
          <Plural value={total} one="# asset" other="# assets" />
        </button>
      </HoverCardTrigger>
      <HoverCardContent align="end" className="w-52 p-1.5">
        <div className="flex flex-col gap-0.5 px-2.5 pt-1.5 pb-2">
          <span className="text-sm font-semibold text-foreground">
            <Trans>Assets do tema</Trans>
          </span>
        </div>
        <div className="space-y-0.5">
          {assets.map((a) => (
            <div
              key={a.label}
              className="flex items-center justify-between rounded-lg px-2.5 py-1.5"
            >
              <span className="text-sm text-foreground">{a.label}</span>
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {a.count}
              </span>
            </div>
          ))}
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}

/** Theme preview: a palette strip + the name in the theme's font, with the
 *  light/dark indicator and a hover assets list in the footer. */
export function ModelCard({ model }: { model: VisualModel }): React.JSX.Element {
  const fontClass = FONT_CLASS[model.font]
  return (
    <div className="group/model flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
      <Link to="/themes" className="flex flex-col">
        <div className="flex h-24 w-full animate-in fade-in-0 duration-500" aria-hidden>
          {model.colors.map((color, i) => (
            <span key={i} className="flex-1" style={{ background: color }} />
          ))}
        </div>
        <div className="space-y-2 p-3.5 pb-2.5">
          <p className={cn('truncate text-base font-semibold text-foreground', fontClass)}>
            {model.name}
          </p>
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <span
              aria-hidden
              className={cn(
                'grid size-[18px] shrink-0 place-items-center rounded-[5px] border border-border text-[0.62rem] font-bold text-foreground',
                fontClass
              )}
            >
              Aa
            </span>
            <span className="truncate">{model.fonts.join(' · ')}</span>
          </span>
        </div>
      </Link>
      <div className="flex items-center justify-between px-3.5 pb-3.5 text-xs text-muted-foreground">
        <ModeBadge modes={model.modes} />
        <AssetsHover assets={model.assets} />
      </div>
    </div>
  )
}
