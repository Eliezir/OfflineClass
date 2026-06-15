import { useEffect, useState } from 'react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { Markdown } from '@/lib/markdown'
import { SectionHeading } from './shared'
import { cn } from '@/lib/utils'
import { docs } from '@/content'

export function Docs() {
  const articleIds = docs.sections.flatMap((s) => s.articles.map((a) => a.id))
  const [active, setActive] = useState(articleIds[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id.replace('doc-', ''))
        })
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )
    articleIds.forEach((id) => {
      const node = document.getElementById(`doc-${id}`)
      if (node) observer.observe(node)
    })
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <section id="docs" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading eyebrow="Documentação" title="Guia rápido" />
      <BlurFade delay={0.1}>
        <div className="mt-3 max-w-2xl text-lg text-muted-foreground">
          <Markdown source={docs.intro} />
        </div>
      </BlurFade>

      <div className="mt-12 grid gap-10 lg:grid-cols-[220px_1fr]">
        {/* side nav */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-6">
            {docs.sections.map((sec) => (
              <div key={sec.id}>
                <p className="mb-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  {sec.title}
                </p>
                <ul className="space-y-1">
                  {sec.articles.map((art) => (
                    <li key={art.id}>
                      <a
                        href={`#doc-${art.id}`}
                        className={cn(
                          'block rounded-md px-3 py-1.5 text-sm transition-colors',
                          active === art.id
                            ? 'bg-accent font-medium text-accent-foreground'
                            : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground',
                        )}
                      >
                        {art.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* articles */}
        <div className="min-w-0">
          {docs.sections.flatMap((sec) =>
            sec.articles.map((art) => (
              <article
                key={art.id}
                id={`doc-${art.id}`}
                className="mb-12 scroll-mt-24"
              >
                <h3 className="mb-4 border-b border-border pb-2 text-2xl font-semibold">
                  {art.title}
                </h3>
                <div className="text-muted-foreground">
                  <Markdown source={art.body} />
                </div>
              </article>
            )),
          )}
        </div>
      </div>
    </section>
  )
}
