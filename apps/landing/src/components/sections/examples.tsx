import { ArrowUpRight } from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { Marquee } from '@/components/magicui/marquee'
import { SectionHeading } from './shared'
import { asset } from '@/lib/asset'
import { site } from '@/content'

export function Examples() {
  return (
    <section id="exemplos" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Exemplos"
        title="Apresentações no estilo que o app gera"
        description="Slides reais publicados na web — abra e navegue."
      />

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {site.examples.map((ex, i) => (
          <BlurFade key={ex.href} delay={0.1 + i * 0.1}>
            <a
              href={ex.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl"
            >
              <div className="aspect-[16/10] overflow-hidden bg-muted">
                <img
                  src={asset(ex.image)}
                  alt={ex.title}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{ex.title}</h3>
                  <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{ex.tag}</p>
              </div>
            </a>
          </BlurFade>
        ))}
      </div>

      {/* Tech stack marquee */}
      <BlurFade delay={0.2} className="mt-16">
        <p className="text-center text-sm text-muted-foreground">
          Construído com tecnologia moderna
        </p>
        <div className="relative mt-5">
          <Marquee pauseOnHover className="[--duration:28s]">
            {site.stack.map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground"
              >
                {tech}
              </span>
            ))}
          </Marquee>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-background" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-background" />
        </div>
      </BlurFade>
    </section>
  )
}
