/**
 * Fonte única de verdade dos locales suportados.
 *
 * Ao adicionar um novo idioma:
 * 1. Adicione o código BCP-47 em `LOCALES`
 * 2. Adicione o nome de exibição em `LOCALE_NAMES`
 * 3. Adicione a bandeira em `LOCALE_FLAGS`
 * 4. Atualize também `lingui.config.ts` (ele não pode importar de `src/`)
 * 5. Rode `pnpm i18n:extract` para gerar o catálogo `.po` do novo locale
 */
export const LOCALES = ['pt-BR', 'en'] as const

export type AppLocale = (typeof LOCALES)[number]

/** Locale padrão da aplicação (também é o `sourceLocale` do Lingui). */
export const DEFAULT_LOCALE: AppLocale = 'pt-BR'

export const LOCALE_NAMES: Record<AppLocale, string> = {
  'pt-BR': 'Português (Brasil)',
  en: 'English'
}

export const LOCALE_FLAGS: Record<AppLocale, string> = {
  'pt-BR': '🇧🇷',
  en: '🇺🇸'
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value != null && (LOCALES as readonly string[]).includes(value)
}
