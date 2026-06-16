import { describe, expect, it, vi } from 'vitest'
import { ProvedorStrategyFactory } from '../src/strategies/ProvedorStrategyFactory'

describe('ProvedorStrategyFactory', () => {
  it('seleciona uma estratégia pelo tipo normalizado', async () => {
    const openAI = {
      tipo: 'openai',
      enviarMensagem: vi.fn().mockResolvedValue('resposta')
    }
    const factory = new ProvedorStrategyFactory([openAI])

    const strategy = factory.porTipo('Open AI')

    expect(strategy).toBe(openAI)
  })

  it('usa a estratégia Anthropic para tipos Claude', () => {
    const anthropic = {
      tipo: 'anthropic',
      enviarMensagem: vi.fn()
    }
    const factory = new ProvedorStrategyFactory([anthropic])

    expect(factory.porTipo('Claude Code')).toBe(anthropic)
  })

  it('rejeita tipos sem estratégia', () => {
    const factory = new ProvedorStrategyFactory([])

    expect(() => factory.porTipo('desconhecido')).toThrow('Tipo de provedor não suportado')
  })
})
