import { useMemo } from 'react'
import {
  Download as DownloadIcon,
  Loader2,
  Construction,
  ArrowUpRight,
  Smartphone,
  Lightbulb,
  MonitorDown,
  Terminal,
  TriangleAlert,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { BlurFade } from '@/components/magicui/blur-fade'
import { DotPattern } from '@/components/magicui/dot-pattern'
import { APP_ICONS, PLATFORM_ICONS } from './shared'
import { matchAppAsset, formatBytes, formatDate, type Release } from '@/hooks/use-releases'
import { useReleasesContext } from '@/hooks/releases-context'
import { site } from '@/content'

type AppDef = (typeof site.apps)[number]
type ReleaseStatus = ReturnType<typeof useReleasesContext>['status']
const MAC_TEACHER_COMMAND = 'xattr -dr com.apple.quarantine "/Applications/OfflineClass.app"'
const MAC_STUDENT_COMMAND =
  'xattr -dr com.apple.quarantine "/Applications/OfflineClass Student.app"'

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

interface AppCardProps {
  app: AppDef
  isMobile: boolean
  osId: string
  latest: Release | null
  status: ReleaseStatus
  releasesUrl: string
}

function AppCard({ app, isMobile, osId, latest, status, releasesUrl }: AppCardProps) {
  const AppIcon = APP_ICONS[app.icon] ?? DownloadIcon
  const primary = site.platforms.find((p) => p.id === osId) ?? site.platforms[0]
  const primaryAsset =
    !isMobile && latest ? matchAppAsset(latest.assets, app.match, primary.match) : undefined
  // On mobile there's no "your platform" — list every desktop platform instead.
  const chips = isMobile ? site.platforms : site.platforms.filter((p) => p.id !== primary.id)

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-sm sm:p-7">
      {/* header */}
      <div className="flex items-start gap-4">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <AppIcon className="size-6" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            App do {app.label}
          </p>
          <h3 className="text-lg font-semibold">OfflineClass {app.label}</h3>
          <p className="mt-1 text-sm text-muted-foreground text-pretty">{app.blurb}</p>
        </div>
      </div>

      {/* primary, OS-detected download */}
      <div className="mt-5">
        {isMobile ? (
          <div className="flex items-center gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-xs text-muted-foreground">
            <Smartphone className="size-4 shrink-0" />
            App de desktop — abra no computador para instalar.
          </div>
        ) : status === 'loading' ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            Detectando o último release…
          </div>
        ) : primaryAsset ? (
          <>
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {latest!.tag_name} · {formatDate(latest!.published_at)}
            </p>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
              {primaryAsset.name} · {formatBytes(primaryAsset.size)}
            </p>
            <Button asChild className="mt-3 w-full" size="lg">
              <a href={primaryAsset.browser_download_url}>
                <DownloadIcon className="size-4" />
                Baixar para {primary.label}
              </a>
            </Button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Construction className="size-4 shrink-0" />
              {status === 'error'
                ? 'Não alcançamos o GitHub.'
                : `Sem build para ${primary.label} ainda.`}
            </div>
            <Button asChild variant="outline" className="mt-3 w-full" size="lg">
              <a href={releasesUrl} target="_blank" rel="noopener noreferrer">
                Ver releases no GitHub
                <ArrowUpRight className="size-4" />
              </a>
            </Button>
          </>
        )}
      </div>

      {/* other platforms + optional hint, pinned to the card bottom for alignment */}
      <div className="mt-auto pt-6">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {isMobile ? 'Disponível para desktop' : 'Outras plataformas'}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((p) => {
            const Icon = PLATFORM_ICONS[p.icon] ?? DownloadIcon
            const asset = latest ? matchAppAsset(latest.assets, app.match, p.match) : undefined
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
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
              >
                {content}
              </a>
            ) : (
              <span
                key={p.id}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3.5 py-1.5 text-sm font-medium text-muted-foreground"
              >
                {content}
              </span>
            )
          })}
        </div>

        {app.hint && (
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground text-pretty">
            <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-primary" />
            {app.hint}
          </p>
        )}
      </div>
    </div>
  )
}

export function Download() {
  const { status, latest } = useReleasesContext()
  const repoUrl = `https://github.com/${site.repo.owner}/${site.repo.name}`
  const releasesUrl = `${repoUrl}/releases`

  const isMobile = useMemo(() => detectMobile(), [])
  const osId = useMemo(() => detectOS(), [])

  return (
    <section
      id="download"
      className="relative scroll-mt-24 overflow-hidden py-20 text-center sm:py-28"
    >
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
          <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground text-pretty">
            Dois apps de desktop: o do professor abre a sala, o do aluno entra na prova. Windows e
            macOS disponíveis agora.
          </p>
        </BlurFade>

        <div className="mx-auto mt-10 grid max-w-4xl gap-5 text-left sm:grid-cols-2">
          {site.apps.map((app, i) => (
            <BlurFade key={app.id} delay={0.15 + i * 0.1} className="h-full">
              <AppCard
                app={app}
                isMobile={isMobile}
                osId={osId}
                latest={latest}
                status={status}
                releasesUrl={releasesUrl}
              />
            </BlurFade>
          ))}
        </div>

        <BlurFade delay={0.35}>
          <div className="mx-auto mt-12 max-w-4xl border-t border-border pt-10 text-left">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">
                Depois do download
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                Como instalar
              </h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                Os instaladores ainda não possuem assinatura digital, por isso o sistema pode
                exibir um aviso de segurança. Baixe somente pelos releases oficiais deste projeto.
              </p>
            </div>

            <div className="mt-7 grid gap-8 md:grid-cols-2 md:gap-12">
              <div>
                <div className="flex items-center gap-2 font-semibold">
                  <MonitorDown className="size-5 text-primary" />
                  Windows
                </div>
                <div className="mt-3 flex items-start gap-3 rounded-xl border border-amber/40 bg-amber/10 p-3.5">
                  <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      O Windows pode proteger o computador
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Esse aviso aparece porque o instalador ainda não é assinado, não porque o
                      arquivo falhou na verificação.
                    </p>
                  </div>
                </div>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-foreground">
                  <li>
                    Abra o instalador{' '}
                    <code className="font-mono text-xs text-foreground">.exe</code>.
                  </li>
                  <li>
                    Se o SmartScreen aparecer, escolha{' '}
                    <strong className="font-semibold text-foreground">Mais informações</strong> e
                    depois{' '}
                    <strong className="font-semibold text-foreground">Executar assim mesmo</strong>.
                  </li>
                </ol>
              </div>

              <div>
                <div className="flex items-center gap-2 font-semibold">
                  <Terminal className="size-5 text-primary" />
                  macOS
                </div>
                <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground marker:text-foreground">
                  <li>
                    Abra o <code className="font-mono text-xs text-foreground">.dmg</code> e arraste
                    o app para Aplicativos.
                  </li>
                  <li>Abra o Terminal e execute o comando do app instalado:</li>
                </ol>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-foreground">Professor</p>
                    <code className="block overflow-x-auto rounded-lg bg-muted px-3 py-2.5 font-mono text-[11px] text-foreground sm:text-xs">
                      {MAC_TEACHER_COMMAND}
                    </code>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-foreground">Aluno</p>
                    <code className="block overflow-x-auto rounded-lg bg-muted px-3 py-2.5 font-mono text-[11px] text-foreground sm:text-xs">
                      {MAC_STUDENT_COMMAND}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BlurFade>

        <BlurFade delay={0.4}>
          <p className="mt-10 text-sm text-muted-foreground">
            Detectamos errado?{' '}
            <a
              href={releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              Ver todos os downloads
            </a>
            . Relate problemas no{' '}
            <a
              href={`${repoUrl}/issues`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </BlurFade>
      </div>
    </section>
  )
}
