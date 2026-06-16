import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'
import { ClipboardList, Sparkles, Users, Wifi } from 'lucide-react'

export type Tone = 'primary' | 'secondary' | 'tertiary' | 'quaternary'

export type OnboardingStep = {
  tone: Tone
  Icon: typeof Wifi
  title: MessageDescriptor
  body: MessageDescriptor
  /** The last content step finishes onboarding instead of advancing. */
  final?: boolean
}

/** Content steps shown after the welcome hero. Edit this array to add, remove or
    reorder onboarding steps — the flow shell adapts automatically. */
export const STEPS: OnboardingStep[] = [
  {
    tone: 'primary',
    Icon: Wifi,
    title: msg`Sem internet, sem problema`,
    body: msg`Seu computador vira o servidor da sala. Os alunos entram pela Wi-Fi local — nada depende da internet.`
  },
  {
    tone: 'tertiary',
    Icon: ClipboardList,
    title: msg`Monte suas provas`,
    body: msg`Crie provas com vários tipos de questão e materiais de apoio. Tudo fica salvo no seu computador.`
  },
  {
    tone: 'quaternary',
    Icon: Users,
    title: msg`Aplique em grupo, ao vivo`,
    body: msg`Os alunos entram por QR code e respondem em grupo, com tudo sincronizado em tempo real.`
  },
  {
    tone: 'secondary',
    Icon: Sparkles,
    title: msg`Tudo pronto!`,
    body: msg`Crie sua conta de professor e comece a aplicar avaliações.`,
    final: true
  }
]
