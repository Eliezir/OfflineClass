import { Link } from 'react-router-dom'
import { Download, Github } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { BlurFade } from '@/components/magicui/blur-fade'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { cn } from '@/lib/utils'
import { site } from '@/content'

export function HomeCTA() {
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`
  return (
    <section className="container-page py-20 sm:py-28">
      <BlurFade>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-16 text-center sm:px-12">
          <DotPattern
            width={20}
            height={20}
            className={cn(
              'fill-primary/15',
              '[mask-image:radial-gradient(420px_circle_at_center,white,transparent)]',
            )}
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Pare de fazer slides. Comece a criar experiências.
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Baixe o Apresenta.AI e transforme seu próximo Markdown em uma
              apresentação HTML interativa.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button size="lg" asChild>
                <Link to="/download">
                  <Download className="size-4" />
                  Baixar agora
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href={repoUrl} target="_blank" rel="noopener noreferrer">
                  <Github className="size-4" />
                  Ver no GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </BlurFade>
    </section>
  )
}
