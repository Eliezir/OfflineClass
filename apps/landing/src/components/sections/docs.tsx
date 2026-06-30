import { useEffect, useState } from 'react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { Markdown } from '@/lib/markdown'
import { SectionHeading } from './shared'
import { DOCS_DIAGRAMS, DOCS_ICONS } from './docs-diagrams'
import { cn } from '@/lib/utils'
import { docs } from '@/content'

/** Flatten articles into ordered slides, keeping each one's group label. */
const slides = docs.sections.flatMap((sec) =>
  sec.articles.map((art) => ({ ...art, group: sec.title })),
)
const total = slides.length
const pad = (n: number) => String(n).padStart(2, '0')

export function Docs() {
  const [active, setActive] = useState(slides[0]?.id)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id.replace('doc-', ''))
        })
      },
      { rootMargin: '-25% 0px -65% 0px' },
    )
    slides.forEach((s) => {
      const node = document.getElementById(`doc-${s.id}`)
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="docs" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Documentação"
        title="Como o OfflineClass funciona por dentro"
      />
      <BlurFade delay={0.1}>
        <div className="mt-3 max-w-2xl text-lg text-muted-foreground">
          <Markdown source={docs.intro} />
        </div>
      </BlurFade>

      <div className="mt-12 grid gap-10 lg:grid-cols-[230px_1fr]">
        {/* numbered stepper */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-6">
            {docs.sections.map((sec) => (
              <div key={sec.id}>
                <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  {sec.title}
                </p>
                <ul className="space-y-0.5">
                  {sec.articles.map((art) => {
                    const n = slides.findIndex((s) => s.id === art.id) + 1
                    const isActive = active === art.id
                    return (
                      <li key={art.id}>
                        <a
                          href={`#doc-${art.id}`}
                          className={cn(
                            'flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors',
                            isActive
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground hover:text-foreground',
                          )}
                        >
                          <span
                            className={cn(
                              'grid size-6 shrink-0 place-items-center rounded-md font-mono text-[0.7rem] transition-colors',
                              isActive
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground',
                            )}
                          >
                            {pad(n)}
                          </span>
                          {art.title}
                        </a>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* slides */}
        <div className="min-w-0 space-y-6">
          {slides.map((slide, i) => {
            const Icon = DOCS_ICONS[slide.icon]
            const Diagram = slide.diagram ? DOCS_DIAGRAMS[slide.diagram] : undefined
            return (
              <BlurFade key={slide.id} delay={0.05} inView>
                <article
                  id={`doc-${slide.id}`}
                  className="scroll-mt-24 rounded-2xl border border-border bg-card p-6 sm:p-8"
                >
                  {/* slide header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-medium tracking-wide uppercase text-muted-foreground">
                        {slide.group} · {pad(i + 1)} / {pad(total)}
                      </p>
                      <h3 className="mt-1.5 text-2xl font-semibold tracking-tight text-balance">
                        {slide.title}
                      </h3>
                    </div>
                    {Icon && (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-6" />
                      </span>
                    )}
                  </div>

                  <div className="mt-5 border-t border-border pt-5">
                    <div
                      className={cn(
                        'gap-8',
                        Diagram && 'grid lg:grid-cols-[1fr_minmax(0,19rem)] lg:items-start',
                      )}
                    >
                      <div className="min-w-0 text-muted-foreground">
                        <Markdown source={slide.body} />
                      </div>
                      {Diagram && (
                        <div className="lg:sticky lg:top-28">
                          <Diagram />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* concept band */}
                  <div className="mt-6 rounded-xl border-l-2 border-primary bg-accent/40 p-4">
                    <p className="text-[0.7rem] font-semibold tracking-wide uppercase text-primary">
                      Conceito de SO &amp; Redes
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-foreground/80">
                      {slide.concept}
                    </p>
                  </div>
                </article>
              </BlurFade>
            )
          })}
        </div>
      </div>
    </section>
  )
}
