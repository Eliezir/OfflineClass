import { Trans, useLingui } from '@lingui/react/macro'
import { Sparkles } from 'lucide-react'
import aldrin from '@renderer/shared/assets/apollo-aldrin.jpg'
import { usePrefersReducedMotion } from '@renderer/shared/hooks/use-prefers-reduced-motion'
import { cn } from '@renderer/shared/utils'
import { easeInOut, lerp, seg } from './anim'
import { DOC_TITLE, RAW_NOTES, SECTIONS } from './content'
import { DocSection } from './doc-section'

/* Feature 1 — "Escreva do seu jeito": a messy braindump is typed out line by
   line, an AI sweep passes, then it reflows into a proper multi-section
   document that scrolls — a real deck's worth of content. */

const TYPE_END = 0.5
const SCROLL_MAX = 520 // px the organized doc travels to reveal its full length

export function WriteScene({ progress }: { progress: number }): React.JSX.Element {
  const { i18n } = useLingui()
  const p = progress
  const reduced = usePrefersReducedMotion()
  const per = TYPE_END / RAW_NOTES.length
  const sweep = seg(p, 0.54, 0.67)
  const organized = p >= 0.67
  // Rest at the top of the doc when motion is reduced (no auto-scroll reveal).
  const scroll = reduced ? 0 : easeInOut(seg(p, 0.74, 0.99))

  return (
    <>
      {/* Raw notes being typed */}
      <div
        className={cn(
          'absolute inset-0 space-y-1.5 p-5 font-mono text-[12px] leading-relaxed text-foreground/80 transition-opacity duration-500',
          organized ? 'pointer-events-none opacity-0' : 'opacity-100'
        )}
      >
        {RAW_NOTES.map((note, i) => {
          const line = i18n._(note)
          const start = i * per
          if (p < start) return null
          const active = p < start + per
          const chars = Math.round(easeInOut(seg(p, start, start + per)) * line.length)
          return (
            <div key={i} className="flex">
              <span className="mr-3 w-4 shrink-0 text-right text-foreground/25">{i + 1}</span>
              <span>
                {active ? line.slice(0, chars) : line}
                {active && (
                  <span className="ml-px inline-block h-3.5 w-[2px] translate-y-0.5 animate-pulse bg-primary" />
                )}
              </span>
            </div>
          )
        })}
      </div>

      {/* AI sweep */}
      {sweep > 0 && sweep < 1 && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-16 bg-gradient-to-b from-transparent via-primary/20 to-transparent"
          style={{ top: `${lerp(-12, 100, easeInOut(sweep))}%` }}
        />
      )}

      {/* Organized multi-section document — auto-scrolls to reveal its length */}
      <div
        className={cn(
          'absolute inset-0 overflow-hidden transition-all duration-500 [transition-timing-function:var(--ease-snap)]',
          organized ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        )}
      >
        <div
          className="space-y-3 p-5"
          style={{ transform: `translateY(${-scroll * SCROLL_MAX}px)` }}
        >
          <div className="font-mono text-[15px] font-bold text-foreground">
            <span className="text-primary/70"># </span>
            {i18n._(DOC_TITLE)}
          </div>
          <figure className="space-y-1">
            <img
              src={aldrin}
              alt=""
              className="aspect-video w-full max-w-[240px] rounded-lg object-cover"
              style={{ objectPosition: '50% 22%' }}
            />
            <figcaption className="font-mono text-[10px] text-muted-foreground">
              <Trans>Buzz Aldrin na Lua · NASA, 1969</Trans>
            </figcaption>
          </figure>
          {SECTIONS.map((s) => (
            <DocSection key={i18n._(s.title)} section={s} />
          ))}
        </div>

        {/* Top/bottom fades hint at more content beyond the viewport */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent" />

        {/* "Organized" toast stays pinned while the doc scrolls */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-medium text-primary-soft-foreground shadow-sm">
          <Sparkles className="size-3.5" />
          <Trans>Organizado pela IA</Trans>
        </div>
      </div>
    </>
  )
}
