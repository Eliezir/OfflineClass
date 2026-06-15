import { useState } from 'react'
import { Moon, Palette, Sun } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'
import { Trans, useLingui } from '@lingui/react/macro'
import { useThemeContext } from '@renderer/shared/hooks/theme-context'
import { Segmented, type SegmentedOption } from '@renderer/shared/ui/segmented'
import { Switch } from '@renderer/shared/ui/switch'
import { SettingRow, SettingsSection } from './settings-section'

type ThemeValue = 'light' | 'dark'

const THEME_OPTIONS: (Omit<SegmentedOption<ThemeValue>, 'label'> & {
  label: MessageDescriptor
})[] = [
  { value: 'light', label: msg`Claro`, icon: <Sun className="size-3.5" /> },
  { value: 'dark', label: msg`Escuro`, icon: <Moon className="size-3.5" /> }
]

export function AppearanceSection(): React.JSX.Element {
  const { i18n, t } = useLingui()
  const { isDark, setIsDark } = useThemeContext()
  // UI-only for now (the app already honors prefers-reduced-motion at the OS level).
  const [reduceMotion, setReduceMotion] = useState(false)

  return (
    <SettingsSection
      icon={Palette}
      title={t`Aparência`}
      description={t`Personalize a aparência do app.`}
    >
      <SettingRow
        title={<Trans>Tema</Trans>}
        description={<Trans>Escolha entre o tema claro e escuro do app.</Trans>}
        control={
          <Segmented
            ariaLabel={t`Tema`}
            options={THEME_OPTIONS.map((o) => ({ ...o, label: i18n._(o.label) }))}
            value={isDark ? 'dark' : 'light'}
            onChange={(v) => setIsDark(v === 'dark')}
          />
        }
      />
      <SettingRow
        title={<Trans>Reduzir movimento</Trans>}
        description={<Trans>Diminui animações e transições da interface.</Trans>}
        control={
          <Switch
            checked={reduceMotion}
            onCheckedChange={setReduceMotion}
            aria-label={t`Reduzir movimento`}
          />
        }
      />
    </SettingsSection>
  )
}
