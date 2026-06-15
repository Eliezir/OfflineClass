import { Link } from 'react-router-dom'
import { Download, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Particles } from '@/components/magicui/particles'
import { BlurFade } from '@/components/magicui/blur-fade'
import { ShimmerButton } from '@/components/magicui/shimmer-button'
import { AnimatedShinyText } from '@/components/magicui/animated-shiny-text'
import { HeroVisual } from './hero-visual'
import { site } from '@/content'

export function Hero() {
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`

  return (
    <section id="hero" className="relative overflow-hidden pt-28 pb-16 sm:pt-36">
      <Particles
        className="absolute inset-0"
        quantity={90}
        ease={70}
        color="#a78bfa"
        refresh
      />
      {/* soft radial backlight, single hue */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[480px] w-[820px] max-w-[90vw] -translate-x-1/2 rounded-full bg-primary/15 blur-[120px]"
      />

      <div className="container-page relative flex flex-col items-center text-center">
        <BlurFade>
          <a
            href={`${repoUrl}/releases`}
            className="group flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 backdrop-blur transition-colors hover:border-primary/40"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            <AnimatedShinyText className="text-sm">
              {site.product.eyebrow}
            </AnimatedShinyText>
          </a>
        </BlurFade>

        <BlurFade delay={0.08}>
          <h1 className="mt-6 max-w-4xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
            {site.product.headline}
            <br />
            <span className="text-primary">{site.product.headlineAccent}</span>
          </h1>
        </BlurFade>

        <BlurFade delay={0.16}>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground text-pretty">
            {site.product.lead}
          </p>
        </BlurFade>

        <BlurFade delay={0.24}>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link to="/download">
              <ShimmerButton className="shadow-lg" background="oklch(0.55 0.24 295)">
                <Download className="size-4" />
                <span className="ml-2 text-sm font-medium">Baixar o app</span>
              </ShimmerButton>
            </Link>
            <Button variant="outline" size="lg" asChild>
              <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                <Github className="size-4" />
                Ver no GitHub
              </a>
            </Button>
          </div>
        </BlurFade>

        {/* Illustrative living-slide visual */}
        <BlurFade delay={0.34} className="mt-20 w-full sm:mt-24">
          <HeroVisual />
        </BlurFade>
      </div>
    </section>
  )
}
