import { Link } from 'react-router-dom'
import { Download, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Particles } from '@/components/magicui/particles'
import { BlurFade } from '@/components/magicui/blur-fade'
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text'
import { HeroVisual } from './hero-visual'
import { site } from '@/content'

export function Hero() {
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`
  const headlineLines = site.product.headline.split('\n').filter(Boolean)

  return (
    <section id="hero" className="relative overflow-hidden pt-28 pb-16 sm:pt-32">
      <Particles className="absolute inset-0 -z-10" quantity={70} ease={70} color="#8b80f5" refresh />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[460px] w-[820px] max-w-[90vw] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />

      <div className="container-page relative grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <BlurFade>
            <a
              href={`${repoUrl}/releases`}
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="size-1.5 rounded-full bg-lime" />
              <AnimatedShinyText className="text-sm">{site.product.eyebrow}</AnimatedShinyText>
            </a>
          </BlurFade>

          <BlurFade delay={0.08}>
            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-balance sm:text-6xl">
              {headlineLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
              <span className="block text-primary">{site.product.headlineAccent}</span>
            </h1>
          </BlurFade>

          <BlurFade delay={0.16}>
            <p className="mt-6 max-w-md text-lg text-muted-foreground text-pretty">
              {site.product.lead}
            </p>
          </BlurFade>

          <BlurFade delay={0.24}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" asChild>
                <Link to="/download">
                  <Download className="size-4" />
                  Baixar o app
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="size-4" />
                  Ver no GitHub
                </a>
              </Button>
            </div>
          </BlurFade>
        </div>

        <BlurFade delay={0.2} className="w-full">
          <HeroVisual />
        </BlurFade>
      </div>
    </section>
  )
}
