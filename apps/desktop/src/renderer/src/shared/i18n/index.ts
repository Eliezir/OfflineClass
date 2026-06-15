import { i18n } from '@lingui/core'
import { messages as ptBR } from '@renderer/locales/pt-BR.po'
import { messages as en } from '@renderer/locales/en.po'
import { DEFAULT_LOCALE, LOCALES, isAppLocale, type AppLocale } from './locales'

const LOCALE_STORAGE_KEY = 'apresenta-ai:locale'

// Todos os catálogos são carregados de forma síncrona no boot (não há lazy loading):
// são poucos idiomas e mantém a ativação de locale instantânea.
i18n.load({ 'pt-BR': ptBR, en })

/**
 * Casa um código BCP-47 do SO (ex.: "en-US", "pt-BR", "pt-PT") com um locale suportado.
 * Tenta o match exato e, em seguida, pelo subtag principal do idioma (ex.: "pt" → "pt-BR").
 */
function matchLocale(tag: string | undefined): AppLocale | undefined {
  if (!tag) return undefined
  if (isAppLocale(tag)) return tag
  const base = tag.toLowerCase().split('-')[0]
  return LOCALES.find((locale) => locale.toLowerCase().split('-')[0] === base)
}

/**
 * Decide o locale inicial: preferência salva → idioma(s) do SO → padrão (pt-BR).
 *
 * No Electron, `navigator.languages` reflete os idiomas preferidos do sistema
 * operacional (em ordem de preferência), então herdamos a escolha do usuário no SO.
 */
export function detectLocale(): AppLocale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isAppLocale(stored)) return stored
  } catch {
    // localStorage indisponível (ex.: contexto sem janela) — segue para o fallback.
  }

  const osLanguages =
    typeof navigator !== 'undefined' ? (navigator.languages ?? [navigator.language]) : []
  for (const tag of osLanguages) {
    const matched = matchLocale(tag)
    if (matched) return matched
  }

  return DEFAULT_LOCALE
}

/** Ativa um locale e persiste a escolha. */
export function activateLocale(locale: AppLocale): void {
  i18n.activate(locale)
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // Ignora se não houver storage; o locale ainda é ativado em memória.
  }
}

/** Ativa o locale detectado. Deve ser chamado antes de renderizar a árvore React. */
export function initI18n(): void {
  i18n.activate(detectLocale())
}

export { i18n }
