import { useState } from 'react'
import { Check, ChevronDown, Languages } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Popover, PopoverContent, PopoverItem, PopoverTrigger } from '@renderer/shared/ui/popover'
import { activateLocale } from '@renderer/shared/i18n'
import {
  LOCALES,
  LOCALE_FLAGS,
  LOCALE_NAMES,
  isAppLocale,
  type AppLocale
} from '@renderer/shared/i18n/locales'
import { cn } from '@renderer/shared/utils'
import { SettingRow, SettingsSection } from './settings-section'

export function LanguageSection(): React.JSX.Element {
  const { i18n, t } = useLingui()
  const [open, setOpen] = useState(false)
  const current: AppLocale = isAppLocale(i18n.locale) ? i18n.locale : 'pt-BR'

  function handleSelect(locale: AppLocale): void {
    activateLocale(locale)
    setOpen(false)
  }

  return (
    <SettingsSection icon={Languages} title={t`Idioma`}>
      <SettingRow
        title={<Trans>Idioma do app</Trans>}
        description={<Trans>A interface será exibida no idioma selecionado.</Trans>}
        control={
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger
              aria-label={t`Idioma do app`}
              className={cn(
                'inline-flex min-w-44 cursor-pointer items-center justify-between gap-2',
                'rounded-[10px] border border-border bg-card px-3 py-1.5 text-sm text-foreground',
                'outline-none transition-colors hover:bg-muted/50',
                'focus-visible:ring-2 focus-visible:ring-ring'
              )}
            >
              <span className="flex items-center gap-2">
                <span className="text-base leading-none">{LOCALE_FLAGS[current]}</span>
                {LOCALE_NAMES[current]}
              </span>
              <ChevronDown
                className={cn('size-4 opacity-60 transition-transform', open && 'rotate-180')}
              />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-56">
              {LOCALES.map((locale) => (
                <PopoverItem
                  key={locale}
                  icon={<span className="text-base leading-none">{LOCALE_FLAGS[locale]}</span>}
                  iconClassName="bg-transparent text-base shadow-none"
                  title={LOCALE_NAMES[locale]}
                  trailing={
                    locale === current ? <Check className="size-4 text-primary" /> : undefined
                  }
                  onClick={() => handleSelect(locale)}
                  className={cn(
                    'transition-colors hover:bg-muted/60 focus-visible:bg-muted/60',
                    locale === current && 'bg-muted/40'
                  )}
                />
              ))}
            </PopoverContent>
          </Popover>
        }
      />
    </SettingsSection>
  )
}
