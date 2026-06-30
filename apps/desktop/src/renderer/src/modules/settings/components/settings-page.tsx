import { Trans } from '@lingui/react/macro'
import { PageHeader } from '@renderer/shared/components/page-header'
import { SyncSection } from '@renderer/modules/sync/components/sync-section'
import { AppearanceSection } from './appearance-section'
import { GeneralSection } from './general-section'
import { LanguageSection } from './language-section'
import { NotificationsSection } from './notifications-section'

export function SettingsPage(): React.JSX.Element {
  return (
    <main className="@container scrollbar-subtle flex-1 overflow-y-auto px-6 pb-10">
      <PageHeader
        title={<Trans>Configurações</Trans>}
        subtitle={<Trans>Ajuste o OfflineClass do seu jeito.</Trans>}
      />

      <div className="grid items-stretch gap-5 @2xl:grid-cols-2">
        <AppearanceSection />
        <LanguageSection />
        <div className="@2xl:col-span-2">
          <NotificationsSection />
        </div>
        <div className="@2xl:col-span-2">
          <SyncSection />
        </div>
        <div className="@2xl:col-span-2">
          <GeneralSection />
        </div>
      </div>
    </main>
  )
}
