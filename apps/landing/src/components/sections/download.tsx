import { useMemo } from 'react'
import {
  Download as DownloadIcon,
  Loader2,
  Construction,
  ArrowUpRight,
  Smartphone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { BlurFade } from '@/components/magicui/blur-fade'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { PLATFORM_ICONS } from './shared'
import { matchAsset, formatBytes, formatDate } from '@/hooks/use-releases'
import { useReleasesContext } from '@/hooks/releases-context'
import { cn } from '@/lib/utils'
import { site } from '@/content'

function detectMobile(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  if (/Android|iPhone|iPod|Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) return true
  // iPadOS 13+ reports as "Macintosh" — distinguish by touch support.
  if (/Macintosh/.test(ua) && (navigator.maxTouchPoints || 0) > 1) return true
  return false
}

function detectOS(): string {
  if (typeof navigator === 'undefined') return 'mac'
  const ua = navigator.userAgent
  if (/Win/i.test(ua)) return 'windows'
  if (/Linux|X11/i.test(ua)) return 'linux'
  return 'mac'
}

export function Download() {
  const { status, latest } = useReleasesContext()
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`
  const releasesUrl = `${repoUrl}/releases`

  const isMobile = useMemo(() => detectMobile(), [])
  const osId = useMemo(() => detectOS(), [])
  const primary = site.platforms.find((p) => p.id === osId) ?? site.platforms[0]
  // On mobile there's no "your platform" — list all desktop platforms instead.
  const chips = isMobile ? site.platforms : site.platforms.filter((p) => p.id !== primary.id)
  const primaryAsset = !isMobile && latest ? matchAsset(latest.assets, primary.match) : undefined
  const PrimaryIcon = PLATFORM_ICONS[primary.icon] ?? DownloadIcon

  return (
    <section id="download" className="relative scroll-mt-24 overflow-hidden py-20 text-center sm:py-28">
      <DotPattern
        width={22}
        height={22}
        className="-z-10 fill-foreground/[0.07] [mask-image:radial-gradient(560px_circle_at_center_top,white,transparent)]"
      />
      <div className="container-page">
        <BlurFade>
          <Logo className="mx-auto size-28 drop-shadow-sm sm:size-32" />
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-5xl">
            Baixe e comece a aplicar.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground text-pretty">
            Roda localmente na sua máquina. Disponível para macOS, Windows e Linux.
          </p>
        </BlurFade>

        <BlurFade delay={0.15} className="mx-auto mt-10 max-w-lg">
          {/* primary, OS-detected card */}
          <div className="rounded-2xl border border-border bg-card p-6 text-left shadow-sm sm:p-7">
            {isMobile ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Smartphone className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      App de desktop
                    </p>
                    <h3 className="text-lg font-semibold">Ainda não temos app para celular</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      O Apresenta.AI roda no computador — macOS, Windows e Linux. Abra
                      esta página no desktop para baixar.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-5 w-full" size="lg">
                  <a href={releasesUrl} target="_blank" rel="noopener noreferrer">
                    Ver releases no GitHub
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </>
            ) : status === 'loading' ? (
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
                Detectando o último release…
              </div>
            ) : primaryAsset ? (
              <>
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <PrimaryIcon className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {latest!.tag_name} · {formatDate(latest!.published_at)}
                    </p>
                    <h3 className="text-lg font-semibold">Baixar para {primary.label}</h3>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {primaryAsset.name} · {formatBytes(primaryAsset.size)}
                    </p>
                  </div>
                </div>
                <Button asChild className="mt-5 w-full" size="lg">
                  <a href={primaryAsset.browser_download_url}>
                    <DownloadIcon className="size-4" />
                    Baixar para {primary.label}
                  </a>
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4">
                  <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground">
                    <Construction className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {status === 'error' ? 'Não alcançamos o GitHub' : 'Em breve'}
                    </p>
                    <h3 className="text-lg font-semibold">Sem build para {primary.label} ainda</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {status === 'error'
                        ? 'Não foi possível buscar o último release. Tente a página de releases direto.'
                        : 'Ainda não publicamos um instalador. Acompanhe os releases no GitHub.'}
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" className="mt-5 w-full" size="lg">
                  <a href={releasesUrl} target="_blank" rel="noopener noreferrer">
                    Ver releases no GitHub
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </>
            )}
          </div>

          {/* other platforms */}
          <p className="mt-8 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {isMobile ? 'Disponível para desktop' : 'Disponível para'}
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-3">
            {chips.map((p) => {
              const Icon = PLATFORM_ICONS[p.icon] ?? DownloadIcon
              const asset = latest ? matchAsset(latest.assets, p.match) : undefined
              const content = (
                <>
                  <Icon className="size-4" />
                  {p.label}
                  {asset ? (
                    <span className="text-xs text-muted-foreground">{formatBytes(asset.size)}</span>
                  ) : (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                      Em breve
                    </span>
                  )}
                </>
              )
              return asset ? (
                <a
                  key={p.id}
                  href={asset.browser_download_url}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
                >
                  {content}
                </a>
              ) : (
                <span
                  key={p.id}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-muted-foreground',
                  )}
                >
                  {content}
                </span>
              )
            })}
          </div>

          {/* footnote */}
          <p className="mt-8 text-sm text-muted-foreground">
            Detectamos errado?{' '}
            <a href={releasesUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              Ver todos os downloads
            </a>
            . Relate problemas no{' '}
            <a href={`${repoUrl}/issues`} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
              GitHub
            </a>
            .
          </p>
        </BlurFade>
      </div>
    </section>
  )
}
