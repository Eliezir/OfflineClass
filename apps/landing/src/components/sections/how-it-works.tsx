import { BlurFade } from '@/components/magicui/blur-fade'
import { SectionHeading } from './shared'
import { site } from '@/content'

export function HowItWorks() {
  return (
    <section id="como-funciona" className="container-page scroll-mt-24 py-20 sm:py-28">
      <SectionHeading
        center
        eyebrow="Como funciona"
        title="Quatro passos até a turma respondendo"
        description="Da autoria da prova aos resultados — sem configurar rede, sem internet."
      />

      <div className="relative mt-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
        {/* connector line behind the nodes (desktop only) */}
        <div
          aria-hidden
          className="absolute top-6 right-[12.5%] left-[12.5%] hidden h-px bg-border lg:block"
        />
        {site.steps.map((step, i) => (
          <BlurFade key={step.n} delay={0.1 + i * 0.08}>
            <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
              <span className="relative z-10 grid size-12 place-items-center rounded-2xl bg-primary font-mono text-base font-bold text-primary-foreground shadow-lg shadow-primary/25">
                {step.n}
              </span>
              <h3 className="mt-5 text-lg font-bold">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">{step.body}</p>
            </div>
          </BlurFade>
        ))}
      </div>
    </section>
  )
}
