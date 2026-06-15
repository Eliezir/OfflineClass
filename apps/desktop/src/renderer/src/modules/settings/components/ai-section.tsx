import { Check, LoaderCircle, Sparkles } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import {
  PROVIDERS,
  useProviderSetup,
  type ProviderSetup
} from '@renderer/shared/services/ai-providers'
import { Segmented, type SegmentedOption } from '@renderer/shared/ui/segmented'
import { SettingRow, SettingsSection } from './settings-section'

const INSTALL_URL = 'https://docs.anthropic.com/en/docs/claude-code'

const PROVIDER_OPTIONS: SegmentedOption<(typeof PROVIDERS)[number]['id']>[] = PROVIDERS.map(
  (p) => ({ value: p.id, label: p.label })
)

export function AiSection(): React.JSX.Element {
  const { t } = useLingui()
  const setup = useProviderSetup()

  return (
    <SettingsSection
      icon={Sparkles}
      title={t`Motor de IA`}
      description={t`Qual IA gera o conteúdo das apresentações.`}
    >
      <SettingRow
        title={<Trans>Provedor</Trans>}
        description={
          <Trans>O Claude Code usa o login local da sua máquina; o Mock gera exemplos.</Trans>
        }
        control={
          <Segmented
            ariaLabel={t`Provedor de IA`}
            options={PROVIDER_OPTIONS}
            value={setup.providerId}
            onChange={setup.setProviderId}
          />
        }
      />
      <div className="px-5 py-3">
        <AiStatus setup={setup} />
      </div>
    </SettingsSection>
  )
}

function AiStatus({ setup }: { setup: ProviderSetup }): React.JSX.Element {
  const { t } = useLingui()

  if (setup.providerId === 'mock') {
    return (
      <span className="text-xs text-muted-foreground">
        <Trans>Pronto — gera conteúdo de exemplo, sem credencial.</Trans>
      </span>
    )
  }

  if (setup.status === 'checking') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <LoaderCircle className="size-3.5 animate-spin" />
        <Trans>Detectando o Claude Code…</Trans>
      </span>
    )
  }

  if (setup.status === 'ok') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
        <Check className="size-3.5" strokeWidth={3} />
        <Trans>Claude Code conectado.</Trans>
      </span>
    )
  }

  if (setup.status === 'error') {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className="font-medium text-destructive">
          {setup.errorMessage ?? t`Não encontramos o Claude Code na sua máquina.`}
        </span>
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
      </div>
    )
  }

  return <span className="text-xs text-transparent select-none">·</span>
}
