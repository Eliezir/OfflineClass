import { BentoGrid, BentoCard } from '@/components/magicui/bento-grid'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { BlurFade } from '@/components/magicui/blur-fade'
import { SectionHeading, FEATURE_ICONS } from './shared'
import { cn } from '@/lib/utils'
import { Sparkles } from 'lucide-react'
import { site } from '@/content'

export function Features() {
  return (
    <section id="recursos" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        eyebrow="Recursos"
        title="Tudo que você precisa, do rascunho ao palco"
        description="Um fluxo único: escreva, deixe a IA estruturar, refine conversando e gere HTML interativo de verdade."
      />

      <BlurFade delay={0.2} className="mt-12">
        <BentoGrid>
          {site.features.map((f, i) => {
            const Icon = FEATURE_ICONS[f.icon] ?? Sparkles
            const wide = f.span === 'wide'
            return (
              <BentoCard
                key={f.title}
                name={f.title}
                description={f.body}
                Icon={Icon}
                className={cn(wide && 'lg:col-span-2')}
                background={
                  <DotPattern
                    width={18}
                    height={18}
                    cx={1}
                    cy={1}
                    cr={1}
                    className={cn(
                      'absolute inset-0 opacity-50 [mask-image:radial-gradient(280px_circle_at_top_right,white,transparent)]',
                      i % 2 === 0 ? 'fill-primary/15' : 'fill-foreground/10',
                    )}
                  />
                }
              />
            )
          })}
        </BentoGrid>
      </BlurFade>
    </section>
  )
}
