import { Loader2 } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { BlurFade } from '@/components/magicui/blur-fade'
import { Markdown } from '@/lib/markdown'
import { SectionHeading } from './shared'
import { formatDate } from '@/hooks/use-releases'
import { useReleasesContext } from '@/hooks/releases-context'
import { site } from '@/content'

export function Releases() {
  const { status, releases } = useReleasesContext()
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`

  return (
    <section
      id="releases"
      className="relative scroll-mt-24 border-y border-border bg-card/30 py-20 sm:py-28"
    >
      <div className="container-page">
        <SectionHeading
          eyebrow="Releases"
          title="Histórico de versões"
          description="As notas de cada versão, direto do GitHub Releases."
        />

        <BlurFade delay={0.15} className="mt-10">
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Carregando releases…
            </div>
          )}

          {status === 'error' && (
            <p className="text-sm text-muted-foreground">
              Não foi possível carregar os releases agora. Veja diretamente em{' '}
              <a
                href={`${repoUrl}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                GitHub Releases
              </a>
              .
            </p>
          )}

          {status === 'success' && releases.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ainda não há releases publicados. Eles aparecerão aqui assim que o
              primeiro for criado no GitHub.
            </p>
          )}

          {status === 'success' && releases.length > 0 && (
            <Accordion
              type="single"
              collapsible
              defaultValue={releases[0].tag_name}
              className="space-y-3"
            >
              {releases.slice(0, 8).map((r) => (
                <AccordionItem
                  key={r.tag_name}
                  value={r.tag_name}
                  className="border px-0"
                >
                  <AccordionTrigger className="px-5">
                    <span className="flex flex-1 flex-wrap items-center gap-3">
                      <span className="font-mono text-base font-semibold text-primary">
                        {r.tag_name}
                      </span>
                      <Badge variant={r.prerelease ? 'warning' : 'success'}>
                        {r.prerelease ? 'pré-lançamento' : 'estável'}
                      </Badge>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatDate(r.published_at)}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="px-5 text-muted-foreground">
                    {r.body ? (
                      <Markdown source={r.body} />
                    ) : (
                      <p>Sem notas para esta versão.</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </BlurFade>
      </div>
    </section>
  )
}
