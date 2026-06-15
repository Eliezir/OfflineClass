import { BlurFade } from '@/components/magicui/blur-fade'
import { BorderBeam } from '@/components/magicui/border-beam'
import { LiveDemo } from './live-demo'
import { SectionHeading, INTERACTIVE_ICONS } from './shared'
import { site } from '@/content'

export function Interactive() {
  return (
    <section
      id="interativo"
      className="relative scroll-mt-24 border-y border-border bg-card/30 py-20 sm:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="Experiências vivas"
          title="Experimente você mesmo"
          description="Esta é uma apresentação real, gerada no estilo do app e rodando aqui mesmo. Clique, navegue e brinque com ela. É HTML de verdade, não uma imagem."
          center
        />

        <BlurFade delay={0.2} className="mt-12">
          <div className="relative mx-auto max-w-4xl rounded-2xl">
            <LiveDemo />
            <BorderBeam size={150} duration={11} />
          </div>
        </BlurFade>

        {/* capability chips */}
        <BlurFade delay={0.3}>
          <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2.5">
            {site.interactive.map((c) => {
              const Icon = INTERACTIVE_ICONS[c.icon]
              return (
                <li
                  key={c.title}
                  className="flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium"
                >
                  {Icon && <Icon className="size-4 text-primary" />}
                  {c.title}
                </li>
              )
            })}
          </ul>
        </BlurFade>
      </div>
    </section>
  )
}
