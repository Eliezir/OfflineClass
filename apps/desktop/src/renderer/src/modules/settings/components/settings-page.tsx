import { Trans, useLingui } from '@lingui/react/macro'
import { Breadcrumb } from '@renderer/shared/components/breadcrumb'
import { AiSection } from './ai-section'
import { AppearanceSection } from './appearance-section'
import { GeneralSection } from './general-section'
import { LanguageSection } from './language-section'
import { NotificationsSection } from './notifications-section'

export function SettingsPage(): React.JSX.Element {
  const { t } = useLingui()

  return (
    <main className="@container scrollbar-subtle flex-1 overflow-y-auto px-6 pt-12 pb-10">
      <header className="mb-8">
        <Breadcrumb
          className="mb-2"
          items={[{ label: t`Início`, to: '/home' }, { label: t`Configurações` }]}
        />
        <h1 className="font-display text-3xl font-bold tracking-tight">
          <Trans>Configurações</Trans>
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          <Trans>Preferências do Apresenta.AI.</Trans>
        </p>
      </header>

      <div className="grid items-stretch gap-5 @2xl:grid-cols-2">
        <AppearanceSection />
        <AiSection />
        <LanguageSection />
        <GeneralSection />
        <div className="@2xl:col-span-2">
          <NotificationsSection />
        </div>
      </div>
    </main>
  )
}
