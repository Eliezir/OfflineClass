import { BlurFade } from '@/components/magicui/blur-fade'
import { MagicCard } from '@/components/magicui/magic-card'
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern'
import { SectionHeading } from './shared'
import { site } from '@/content'

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="relative scroll-mt-24 overflow-hidden border-y border-border bg-card/30 py-20 sm:py-28"
    >
      <AnimatedGridPattern
        numSquares={30}
        maxOpacity={0.06}
        duration={3}
        className="[mask-image:radial-gradient(640px_circle_at_center,white,transparent)] inset-x-0 -top-1/4 h-[150%]"
      />
      <div className="container-page relative">
        <SectionHeading
          eyebrow="Como funciona"
          title="Quatro passos até o resultado"
          description="Da ideia solta à apresentação final — com loops de refino sempre que precisar."
          center
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {site.steps.map((step, i) => (
            <BlurFade key={step.n} delay={0.1 + i * 0.08}>
              <MagicCard className="h-full rounded-xl">
                <div className="flex h-full flex-col gap-3 p-6">
                  <span className="inline-flex w-fit items-center rounded-lg bg-primary/10 px-2.5 py-1 font-mono text-sm font-medium text-primary">
                    {step.n}
                  </span>
                  <h3 className="text-lg font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
              </MagicCard>
            </BlurFade>
          ))}
        </div>
      </div>
    </section>
  )
}
