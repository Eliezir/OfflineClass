import { Trans, useLingui } from '@lingui/react/macro'
import { PROVIDERS, type ProviderSetup } from '@renderer/shared/services/ai-providers'
import { cn } from '@renderer/shared/utils'
import { ProviderOrb } from './provider-orb'
import { ProviderToggle } from './provider-toggle'

const INSTALL_URL = 'https://docs.anthropic.com/en/docs/claude-code'

export function SetupSlide({ setup }: { setup: ProviderSetup }): React.JSX.Element {
  const { t } = useLingui()
  const provider = PROVIDERS.find((p) => p.id === setup.providerId)
  const errored = setup.status === 'error'

  const primary = errored
    ? (setup.errorMessage ?? t`Não encontramos o Claude Code na sua máquina.`)
    : provider?.description

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-6 text-center">
      <ProviderOrb providerId={setup.providerId} status={setup.status} ready={setup.canContinue} />

      <div className="space-y-2">
        <div className="font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
          <Trans>Último passo</Trans>
        </div>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          <Trans>Escolha o motor de IA</Trans>
        </h2>
      </div>

      <div className="w-full space-y-4">
        <ProviderToggle value={setup.providerId} onChange={setup.setProviderId} />

        {/* Fixed-height detail zone — one region that swaps its contents across
            every provider/state, so the centered slide never reflows (no CLS). */}
        <div className="flex min-h-14 flex-col items-center justify-start gap-1.5">
          <p
            key={`${setup.providerId}-${errored}`}
            className={cn(
              'animate-in text-center text-xs leading-snug text-pretty fade-in slide-in-from-bottom-1',
              'animation-duration-[260ms] [animation-timing-function:var(--ease-out)]',
              errored ? 'font-medium text-destructive' : 'text-muted-foreground'
            )}
          >
            {primary}
          </p>

          <DetailStatus setup={setup} />
        </div>
      </div>
    </div>
  )
}

/** The secondary status line under the description — reassurance for Mock, live
    probe state for Claude Code, and recovery actions when detection fails. */
function DetailStatus({ setup }: { setup: ProviderSetup }): React.JSX.Element {
  if (setup.providerId === 'mock') {
    return (
      <span className="text-[11px] text-muted-foreground/80">
        <Trans>Sem chave, sem custo — troque quando quiser.</Trans>
      </span>
    )
  }

  if (setup.status === 'checking') {
    return (
      <span className="animate-pulse text-[11px] text-muted-foreground">
        <Trans>Detectando o Claude Code…</Trans>
      </span>
    )
  }

  if (setup.status === 'ok') {
    return (
      <span className="text-[11px] font-medium text-success">
        <Trans>Claude Code conectado.</Trans>
      </span>
    )
  }

  if (setup.status === 'error') {
    return (
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px]">
        <button
          type="button"
          onClick={setup.check}
          className="cursor-pointer font-medium text-foreground underline-offset-2 hover:underline"
        >
          <Trans>Tentar de novo</Trans>
        </button>
        <span className="text-muted-foreground/40">·</span>
        <a
          href={INSTALL_URL}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          <Trans>Instalar Claude Code</Trans>
        </a>
        <span className="text-muted-foreground/40">·</span>
        <button
          type="button"
          onClick={() => setup.setProviderId('mock')}
          className="cursor-pointer font-medium text-muted-foreground underline-offset-2 hover:underline"
        >
          <Trans>Usar Mock</Trans>
        </button>
      </div>
    )
  }

  // idle (e.g. a brief frame before the auto-probe kicks in) — hold the height.
  return (
    <span aria-hidden className="text-[11px] text-transparent select-none">
      ·
    </span>
  )
}
