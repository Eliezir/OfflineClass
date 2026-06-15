import { ExcecaoValidacao } from '../exception/excecao-validacao'
import { AnthropicProvedorStrategy } from './AnthropicProvedorStrategy'
import type { IProvedorStrategy } from './IProvedorStrategy'
import { OpenAIProvedorStrategy } from './OpenAIProvedorStrategy'

export class ProvedorStrategyFactory {
  private readonly strategies = new Map<string, IProvedorStrategy>()

  constructor(
    strategies: IProvedorStrategy[] = [
      new OpenAIProvedorStrategy(),
      new AnthropicProvedorStrategy()
    ]
  ) {
    for (const strategy of strategies) {
      this.strategies.set(this.normaliza(strategy.tipo), strategy)
    }
  }

  porTipo(tipo: string): IProvedorStrategy {
    const normalizado = this.normaliza(tipo)
    const alias = normalizado.includes('claude') ? 'anthropic' : normalizado
    const strategy = this.strategies.get(alias)

    if (!strategy) {
      throw new ExcecaoValidacao(`Tipo de provedor não suportado: ${tipo}`)
    }

    return strategy
  }

  private normaliza(tipo: string) {
    return tipo
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
  }
}
