import { Link } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { SectionHeading, UNDERHOOD_ICONS } from './shared'
import { site } from '@/content'

/** Home teaser for the technical deep-dive — four cards, each linking into the
    matching article on the /docs ("Técnico") page. */
export function UnderHood() {
  const { eyebrow, title, description, cards } = site.underHood

  return (
    <section id="arquitetura" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading center eyebrow={eyebrow} title={title} description={description} />

      <div className="mt-12 grid gap-4 sm:grid-cols-2">
        {cards.map((card, i) => {
          const Icon = UNDERHOOD_ICONS[card.icon]
          return (
            <BlurFade key={card.title} delay={0.1 + i * 0.08}>
              <Link
                to={card.to}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    {Icon && <Icon className="size-5" />}
                  </span>
                  <h3 className="text-base font-bold">{card.title}</h3>
                  <ArrowUpRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground text-pretty">
                  {card.body}
                </p>
              </Link>
            </BlurFade>
          )
        })}
      </div>

      <BlurFade delay={0.4}>
        <div className="mt-8 flex justify-center">
          <Link
            to="/docs"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary/40 hover:text-primary"
          >
            Ver o guia técnico completo
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </BlurFade>
    </section>
  )
}
