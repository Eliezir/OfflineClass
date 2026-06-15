import type { Provider } from './types'

export const PROVIDERS: Provider[] = [
  {
    id: 'claude-code',
    label: 'Claude Code SDK',
    description:
      'Usa o Claude Code instalado na sua máquina — sem chave, autentica com seu login atual.',
    requiresCheck: true
  },
  {
    id: 'mock',
    label: 'Mock',
    description: 'Gera conteúdo de exemplo, sem credencial. Ótimo para experimentar o app.',
    requiresCheck: false
  }
]
