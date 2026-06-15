import { Trans, useLingui } from '@lingui/react/macro'
import { ChevronLeft, ChevronRight, Code2, Maximize2 } from 'lucide-react'
import { cn } from '@renderer/shared/utils'
import { Cursor } from '../cursor'
import { easeInOut, lerp, seg } from './anim'
import { ExpandedPresenter } from './presenter'
import { MiniSlide, SlideTemplate } from './slide-template'
import { THEMES } from './themes'

/* Feature 3 — "Vira apresentação de verdade": a cursor picks a visual model
   (each card shows its palette), a generation bar fills, the finished deck
   appears framed, then the cursor expands it fullscreen and pages to the
   table-of-contents slide — a real, interactive HTML presentation. */

const SELECTED = 0 // Cosmos (leftmost card)
const TOGGLED = 2 // Solar (the light model) — what the on-slide theme toggle switches to

export function GenerateScene({ progress }: { progress: number }): React.JSX.Element {
  const { i18n, t } = useLingui()
  const p = progress
  // Picked Cosmos; after paging to the TOC, the on-slide toggle flips to Light.
  const themeIndex = p >= 0.84 ? TOGGLED : SELECTED
  const theme = THEMES[themeIndex]

  const selected = p >= 0.18
  const gen = seg(p, 0.24, 0.42)
  const showPicker = p < 0.46
  const showSmall = p >= 0.44 && p < 0.56
  const showExpanded = p >= 0.56
  const slide = p >= 0.7 ? 1 : 0

  // Cursor choreography: card → expand → next (navigate) → theme (dark→light).
  const pickClick = p >= 0.16 && p < 0.2
  const expandClick = p >= 0.52 && p < 0.56
  const nextClick = p >= 0.66 && p < 0.7
  const themeClick = p >= 0.8 && p < 0.84
  let cx: number
  let cy: number
  if (p < 0.44) {
    // → leftmost picker card (Cosmos), mid-height
    const m = easeInOut(seg(p, 0.04, 0.16))
    cx = lerp(96, 19, m)
    cy = lerp(116, 44, m)
  } else if (p < 0.56) {
    // → expand icon in the framed presenter's top bar
    const m = easeInOut(seg(p, 0.45, 0.52))
    cx = lerp(19, 74, m)
    cy = lerp(44, 16, m)
  } else if (p < 0.74) {
    // → "next" control floating top-right of the fullscreen presenter
    const m = easeInOut(seg(p, 0.6, 0.66))
    cx = lerp(74, 95, m)
    cy = lerp(16, 7, m)
  } else {
    // → theme toggle on the slide (top-left)
    const m = easeInOut(seg(p, 0.74, 0.8))
    cx = lerp(95, 6, m)
    cy = lerp(7, 6, m)
  }

  return (
    <div className="absolute inset-0">
      {/* Model picker + generation */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-5 p-6 transition-opacity duration-500',
          showPicker ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      >
        <div className="w-full">
          <div className="mb-3 text-center font-mono text-[11px] text-muted-foreground">
            <Trans>Escolha um modelo visual</Trans>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {THEMES.map((t, i) => (
              <div
                key={t.id}
                className={cn(
                  'overflow-hidden rounded-md border bg-card transition-all duration-300 [transition-timing-function:var(--ease-out)]',
                  selected && i === SELECTED
                    ? 'scale-[1.03] border-primary ring-2 ring-primary/30'
                    : 'border-border'
                )}
              >
                <MiniSlide theme={t} />
                <div className="space-y-1 p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-semibold text-foreground">
                      {i18n._(t.name)}
                    </span>
                    <div className="flex gap-1">
                      {[t.bg, t.accent, t.fg].map((c, si) => (
                        <span
                          key={si}
                          className="size-2.5 rounded-full ring-1 ring-foreground/10"
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="text-[9px] leading-tight text-muted-foreground">
                    {i18n._(t.blurb)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          className={cn(
            'w-full max-w-[240px] transition-opacity duration-300',
            gen > 0 ? 'opacity-100' : 'opacity-0'
          )}
        >
          <div className="mb-1.5 text-center font-mono text-[11px] text-muted-foreground">
            {gen >= 1 ? t`Pronto` : t`Gerando HTML…`}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-100"
              style={{ width: `${gen * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Finished deck, framed as an interactive HTML presentation */}
      <div
        className={cn(
          'absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 transition-all duration-500 [transition-timing-function:var(--ease-snap)]',
          showSmall ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        <div className="w-full max-w-[460px] overflow-hidden rounded-md border border-border shadow-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 bg-muted/50 px-3 py-1.5">
            <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground">
              <Code2 className="size-3 text-primary" />
              apresentacao.html
            </span>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[9px] font-medium text-primary-soft-foreground">
                <Trans>HTML interativo</Trans>
              </span>
              <span
                className={cn(
                  'grid size-5 place-items-center rounded transition-all duration-150',
                  expandClick ? 'scale-90 bg-primary/15 text-primary' : 'text-muted-foreground'
                )}
              >
                <Maximize2 className="size-3" />
              </span>
            </div>
          </div>

          <SlideTemplate theme={theme} />

          <div className="flex items-center justify-between gap-2 border-t border-border/60 bg-card px-3 py-1.5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChevronLeft className="size-3.5" />
              <div className="flex gap-1">
                {[0, 1, 2, 3].map((d) => (
                  <span
                    key={d}
                    className={cn(
                      'size-1 rounded-full',
                      d === 0 ? 'bg-primary' : 'bg-foreground/20'
                    )}
                  />
                ))}
              </div>
              <ChevronRight className="size-3.5 text-foreground/70" />
            </div>
            <span className="font-mono text-[9px] text-muted-foreground">
              <Trans>8 slides · interativo</Trans>
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-16 overflow-hidden rounded-sm border border-border"
              style={{ opacity: i === 0 ? 1 : 0.5 }}
            >
              <MiniSlide theme={theme} />
            </div>
          ))}
        </div>
      </div>

      {/* Expanded fullscreen presenter — interactive paging to the TOC slide */}
      <div
        className={cn(
          'absolute inset-0 transition-all duration-500 [transition-timing-function:var(--ease-snap)]',
          showExpanded ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        )}
      >
        <ExpandedPresenter
          theme={theme}
          slide={slide}
          nextActive={nextClick}
          themeActive={themeClick}
        />
      </div>

      <Cursor
        x={cx}
        y={cy}
        clicking={pickClick || expandClick || themeClick || nextClick}
        visible={p < 0.92}
      />
    </div>
  )
}
