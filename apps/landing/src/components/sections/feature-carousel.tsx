import { useRef } from 'react'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { INTERACTIVE_ICONS } from './shared'
import { cn } from '@/lib/utils'
import { site } from '@/content'

// Vivid, contained pop of color for the showcase band — one tone per card.
const CARD_TONES = [
  'bg-violet-300 text-violet-950',
  'bg-fuchsia-300 text-fuchsia-950',
  'bg-amber-300 text-amber-950',
  'bg-emerald-300 text-emerald-950',
  'bg-sky-300 text-sky-950',
  'bg-rose-300 text-rose-950',
]

export function FeatureCarousel() {
  const scroller = useRef<HTMLDivElement>(null)

  const scrollBy = (dir: number) => {
    const el = scroller.current
    if (!el) return
    const card = el.querySelector<HTMLElement>('[data-card]')
    const amount = card ? card.offsetWidth + 20 : el.clientWidth * 0.8
    el.scrollBy({ left: dir * amount, behavior: 'smooth' })
  }

  return (
    <section id="showcase" className="scroll-mt-24 overflow-hidden py-20 sm:py-28">
      <div className="container-page">
        <BlurFade>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-xl">
              <p className="mb-3 text-xs font-semibold tracking-wide uppercase text-primary">
                O diferencial
              </p>
              <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
                Muito mais que apenas um slide.
              </h2>
            </div>
            <p className="max-w-sm text-lg text-muted-foreground text-pretty">
              As apresentações são HTML real — navegáveis, interativas e cheias de
              vida. Veja o que cabe em um único slide.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => scrollBy(-1)}
              aria-label="Anterior"
              className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="size-4.5" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              aria-label="Próximo"
              className="grid size-11 place-items-center rounded-full border border-border text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowRight className="size-4.5" />
            </button>
          </div>
        </BlurFade>
      </div>

      {/* scroller — bleeds to the right edge like the reference */}
      <div
        ref={scroller}
        className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-6 px-[max(1.5rem,calc((100vw-76rem)/2))] pb-4"
      >
        {site.interactive.map((feat, idx) => {
          const Icon = INTERACTIVE_ICONS[feat.icon] ?? Check
          return (
            <article
              key={feat.title}
              data-card
              className={cn(
                'flex h-auto w-[86vw] max-w-[22rem] shrink-0 snap-start flex-col overflow-hidden rounded-3xl md:h-[27rem] md:w-[42rem] md:max-w-none md:flex-row',
                CARD_TONES[idx % CARD_TONES.length],
              )}
            >
              {/* text column */}
              <div className="flex flex-col p-7 md:w-[44%] md:p-8">
                <span className="font-mono text-sm font-semibold opacity-70">
                  {idx + 1}/{site.interactive.length}
                </span>
                <div className="mt-3 flex items-center gap-2.5">
                  <Icon className="size-6" strokeWidth={2} />
                  <h3 className="text-2xl font-semibold tracking-tight">{feat.title}</h3>
                </div>
                <p className="mt-2 text-sm/relaxed font-medium opacity-90">{feat.body}</p>

                {feat.points && (
                  <ul className="mt-auto space-y-2.5 pt-6">
                    {feat.points.map((p) => (
                      <li key={p} className="flex items-center gap-2 text-xs font-semibold">
                        <span className="grid size-5 shrink-0 place-items-center rounded-md bg-zinc-950/15">
                          <Check className="size-3" />
                        </span>
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* visual column */}
              <div className="flex flex-1 items-center justify-center p-5 pt-0 md:py-8 md:pr-8 md:pl-0">
                <FeatureVisual kind={feat.icon} />
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/** Dark mock UI per capability — legible on any card tone, fills its column. */
function FeatureVisual({ kind }: { kind: string }) {
  return (
    <div className="flex h-full min-h-44 w-full flex-col justify-center gap-3 rounded-2xl bg-zinc-950/90 p-5 text-zinc-100 shadow-lg ring-1 ring-black/10">
      {kind === 'quiz' && (
        <div className="space-y-2.5">
          <p className="text-xs font-medium text-zinc-400">Strategy favorece…</p>
          {['Composição', 'Herança', 'Globais'].map((o, i) => (
            <div
              key={o}
              className={cn(
                'flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm',
                i === 0 ? 'border-emerald-500 bg-emerald-500/15' : 'border-zinc-700',
              )}
            >
              {o}
              {i === 0 && <Check className="size-4 text-emerald-400" />}
            </div>
          ))}
        </div>
      )}

      {kind === 'carousel' && (
        <div className="space-y-4">
          <div className="flex gap-2.5">
            {['bg-violet-400', 'bg-fuchsia-400', 'bg-amber-300'].map((c, i) => (
              <div key={i} className={cn('h-24 flex-1 rounded-lg', c, i === 1 ? 'opacity-100' : 'opacity-40')} />
            ))}
          </div>
          <div className="flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} className={cn('h-1.5 rounded-full', i === 1 ? 'w-6 bg-white' : 'w-1.5 bg-zinc-600')} />
            ))}
          </div>
        </div>
      )}

      {kind === 'zoom' && (
        <div className="relative h-40 overflow-hidden rounded-lg bg-zinc-800">
          <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 gap-px opacity-30">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="bg-zinc-600" />
            ))}
          </div>
          <div className="absolute top-1/2 left-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80 bg-white/10 backdrop-blur-[1px]">
            <span className="absolute -right-1.5 -bottom-1.5 h-5 w-2 rotate-45 rounded bg-white/80" />
          </div>
        </div>
      )}

      {kind === 'shortcuts' && (
        <div className="flex items-center justify-center gap-2.5 py-6">
          {['←', '→', 'F'].map((k) => (
            <kbd
              key={k}
              className="grid h-12 min-w-12 place-items-center rounded-lg border border-zinc-700 bg-zinc-800 px-2 font-mono text-base shadow-[0_3px_0_#000]"
            >
              {k}
            </kbd>
          ))}
        </div>
      )}

      {kind === 'theme' && (
        <div className="flex items-center justify-center gap-4 py-6">
          <div className="flex overflow-hidden rounded-full border border-zinc-700">
            <span className="bg-white px-4 py-2.5 text-sm font-semibold text-zinc-900">claro</span>
            <span className="bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-zinc-100">escuro</span>
          </div>
          <div className="size-12 rounded-full bg-linear-to-r from-white to-zinc-900 ring-1 ring-zinc-600" />
        </div>
      )}

      {kind === 'language' && (
        <div className="flex items-center justify-center gap-3 py-6">
          {['PT', 'EN'].map((l, i) => (
            <span
              key={l}
              className={cn(
                'rounded-lg px-5 py-2.5 text-base font-semibold',
                i === 0 ? 'bg-violet-500 text-white' : 'border border-zinc-700 text-zinc-300',
              )}
            >
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
