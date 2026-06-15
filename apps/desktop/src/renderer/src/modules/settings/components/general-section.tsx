import { GraduationCap, RotateCcw } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { resetOnboarding } from '@renderer/modules/onboarding/hooks/onboarding-storage'
import { SettingRow, SettingsSection } from './settings-section'

export function GeneralSection(): React.JSX.Element {
  const { t } = useLingui()
  const navigate = useNavigate()

  const replayIntro = (): void => {
    resetOnboarding()
    void navigate({ to: '/onboarding' })
  }

  return (
    <SettingsSection
      icon={GraduationCap}
      title={t`Tutorial`}
      description={t`Primeiros passos no Apresenta.AI.`}
    >
      <SettingRow
        title={<Trans>Introdução</Trans>}
        description={<Trans>Reveja o tour de boas-vindas do Apresenta.AI.</Trans>}
        control={
          <Button variant="secondary" size="sm" onClick={replayIntro}>
            <RotateCcw />
            <Trans>Refazer introdução</Trans>
          </Button>
        }
      />
    </SettingsSection>
  )
}
