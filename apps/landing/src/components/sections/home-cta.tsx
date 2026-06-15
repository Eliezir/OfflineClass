import { Link } from 'react-router-dom'
import { Download, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlurFade } from '@/components/magicui/blur-fade'
import { site } from '@/content'

export function HomeCTA() {
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`
  return (
    <section className="container-page py-20 sm:py-28">
      <BlurFade>
        <div className="relative overflow-hidden rounded-3xl bg-primary px-6 py-16 text-center text-primary-foreground sm:px-12">
          {/* faint dot-grid in the panel, drawn with the foreground color */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:radial-gradient(currentColor_1px,transparent_1px)] [background-size:20px_20px]"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
              Sua próxima prova, na rede da sala.
            </h2>
            <p className="mt-4 text-lg opacity-90 text-pretty">
              Baixe o OfflineClass e aplique avaliações colaborativas em tempo real — sem depender
              da internet.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/download">
                  <Download className="size-4" />
                  Baixar agora
                </Link>
              </Button>
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
              >
                <Github className="size-4" />
                Ver no GitHub
              </a>
            </div>
          </div>
        </div>
      </BlurFade>
    </section>
  )
}
