import { BlurFade } from '@/components/magicui/blur-fade'
import { Markdown } from '@/lib/markdown'
import { DOCS_DIAGRAMS, DOCS_ICONS } from './docs-diagrams'
import { cn } from '@/lib/utils'
import { docs, type DocArticle } from '@/content'

export const totalArticles = docs.sections.reduce(
  (n, s) => n + s.articles.length,
  0,
)
export const pad = (n: number) => String(n).padStart(2, '0')

/** A single deck entry — either a section opener or an article. */
export type Slide =
  | { kind: 'intro'; key: string; index: number; title: string; lead: string }
  | { kind: 'article'; key: string; article: DocArticle; group: string; n: number }

/** Flatten the sections into the ordered list of slides the deck renders. */
export const slides: Slide[] = (() => {
  const out: Slide[] = []
  let n = 0
  docs.sections.forEach((sec, index) => {
    out.push({ kind: 'intro', key: `intro-${sec.id}`, index, title: sec.title, lead: sec.lead })
    sec.articles.forEach((article) => {
      n += 1
      out.push({ kind: 'article', key: article.id, article, group: sec.title, n })
    })
  })
  return out
})()

/** Full-height opening slide for a section. */
function SectionIntro({
  index,
  title,
  lead,
  present,
}: {
  index: number
  title: string
  lead: string
  present?: boolean
}) {
  return (
    <section
      className={cn(
        'relative flex flex-col justify-center overflow-hidden rounded-3xl border border-border bg-card p-10 sm:p-16',
        present ? 'h-full' : 'min-h-[70vh]',
      )}
    >
      {/* indigo glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/4 -left-1/4 size-[60%] rounded-full bg-primary/20 blur-3xl"
      />
      <div className="relative">
        <p className="font-mono text-7xl font-extrabold tracking-tighter text-primary/45 sm:text-8xl">
          {pad(index + 1)}
        </p>
        <p className="mt-3 text-sm font-semibold tracking-[0.14em] uppercase text-primary">
          Documentação
        </p>
        <h2 className="mt-3 text-4xl font-extrabold tracking-tight text-balance sm:text-6xl">
          {title}
        </h2>
        <p className="mt-5 max-w-xl text-lg text-muted-foreground text-pretty sm:text-xl">
          {lead}
        </p>
        {/* progress dots */}
        <div className="mt-10 flex gap-2">
          {docs.sections.map((s, i) => (
            <span
              key={s.id}
              className={cn(
                'h-2 rounded-full transition-all',
                i === index ? 'w-6 bg-primary' : 'w-2 bg-border',
              )}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

/** The visual slot: a scaled diagram, or an oversized icon + pull-quote. */
function SlideVisual({ article }: { article: DocArticle }) {
  const Diagram = article.diagram ? DOCS_DIAGRAMS[article.diagram] : undefined
  if (Diagram) return <Diagram />

  const Icon = DOCS_ICONS[article.icon]
  return (
    <div className="grid min-h-[20rem] place-items-center rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
      <div>
        {Icon && <Icon className="mx-auto size-24 text-primary/50" strokeWidth={1.5} />}
        {article.quote && (
          <p className="mx-auto mt-5 max-w-[22ch] text-lg font-bold text-balance text-foreground">
            {article.quote}
          </p>
        )}
      </div>
    </div>
  )
}

/** Full-height content slide for a single article. */
function ContentSlide({
  article,
  group,
  n,
  present,
}: {
  article: DocArticle
  group: string
  n: number
  present?: boolean
}) {
  const Icon = DOCS_ICONS[article.icon]
  return (
    <article
      id={present ? undefined : `doc-${article.id}`}
      className={cn(
        'flex flex-col rounded-3xl border border-border bg-card p-7 sm:p-12',
        present ? 'h-full' : 'min-h-[78vh] scroll-mt-24',
      )}
    >
      {/* header */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="font-mono text-xs font-medium tracking-wide uppercase text-muted-foreground">
            {group} · {pad(n)} / {pad(totalArticles)}
          </p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
            {article.title}
          </h3>
          {article.tech && article.tech.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {article.tech.map((t) => (
                <li
                  key={t}
                  className="rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-xs font-medium text-foreground/80"
                >
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
        {Icon && (
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-8" />
          </span>
        )}
      </div>

      {/* body */}
      <div className="mt-10 grid flex-1 items-center gap-10 lg:grid-cols-[1fr_minmax(0,28rem)]">
        <div className="min-w-0 text-lg text-muted-foreground">
          <Markdown source={article.body} />
        </div>
        <div className="lg:self-center">
          <SlideVisual article={article} />
        </div>
      </div>

      {/* concept footer */}
      <div className="mt-10 rounded-2xl border-l-[3px] border-primary bg-accent/50 p-5 sm:p-6">
        <p className="text-xs font-semibold tracking-wide uppercase text-primary">
          Conceito de SO &amp; Redes
        </p>
        <p className="mt-2 text-base leading-relaxed text-foreground/85">
          {article.concept}
        </p>
      </div>
    </article>
  )
}

/** Render one slide. `present` swaps fill-height for scroll-flow behaviour. */
export function SlideView({ slide, present }: { slide: Slide; present?: boolean }) {
  const body =
    slide.kind === 'intro' ? (
      <SectionIntro index={slide.index} title={slide.title} lead={slide.lead} present={present} />
    ) : (
      <ContentSlide
        article={slide.article}
        group={slide.group}
        n={slide.n}
        present={present}
      />
    )

  if (present) return body
  return <BlurFade inView>{body}</BlurFade>
}
