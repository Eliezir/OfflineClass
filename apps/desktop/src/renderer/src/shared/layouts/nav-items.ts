import { ChartColumn, ClipboardList, House, Radio, Settings, UserRound } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'

export type NavTo = '/home' | '/provas' | '/sessao' | '/resultados' | '/profile' | '/settings'

export type NavItem = {
  label: MessageDescriptor
  caption?: MessageDescriptor
  icon: React.ComponentType<{ className?: string }>
  to: NavTo
}

/** Primary workspace destinations, in sidebar order. */
export const primaryNav: NavItem[] = [
  { label: msg`Início`, caption: msg`Painel inicial`, icon: House, to: '/home' },
  { label: msg`Provas`, caption: msg`Suas avaliações`, icon: ClipboardList, to: '/provas' },
  { label: msg`Sessão`, caption: msg`Aplicar ao vivo`, icon: Radio, to: '/sessao' },
  { label: msg`Resultados`, caption: msg`Notas e relatórios`, icon: ChartColumn, to: '/resultados' }
]

export const profileNav: NavItem = {
  label: msg`Perfil`,
  caption: msg`Seus dados de professor`,
  icon: UserRound,
  to: '/profile'
}

export const settingsNav: NavItem = {
  label: msg`Configurações`,
  caption: msg`Preferências do app`,
  icon: Settings,
  to: '/settings'
}

/** Every navigable page, in palette order. */
export const allNav: NavItem[] = [...primaryNav, profileNav, settingsNav]
