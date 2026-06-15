import { WifiOff } from 'lucide-react'
import { BlurFade } from '@/components/magicui/blur-fade'
import { SectionHeading, FEATURE_ICONS } from './shared'
import { site } from '@/content'

const ACCENT: Record<string, string> = {
  primary: 'bg-primary/12 text-primary',
  secondary: 'bg-lime/15 text-lime',
  tertiary: 'bg-amber/15 text-amber',
  quaternary: 'bg-coral/15 text-coral',
}

export function Features() {
  return (
    <section id="recursos" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Recursos"
        title="Tudo que a sala precisa, sem depender da internet"
        description="Da autoria da prova ao painel ao vivo: um app offline-first que roda na rede local da sua sala de aula."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {site.features.map((f, i) => {
          const Icon = FEATURE_ICONS[f.icon] ?? WifiOff
          return (
            <BlurFade key={f.title} delay={0.05 * i}>
              <div className="h-full rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/40">
                <span
                  className={`grid size-11 place-items-center rounded-xl ${ACCENT[f.accent] ?? ACCENT.primary}`}
                >
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground text-pretty">{f.body}</p>
              </div>
            </BlurFade>
          )
        })}
      </div>
    </section>
  )
}
