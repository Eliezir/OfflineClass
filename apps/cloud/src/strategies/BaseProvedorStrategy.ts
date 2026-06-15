import { ExcecaoApp } from '../exception/excecao-app'
import type { IProvedorStrategy } from './IProvedorStrategy'

export abstract class BaseProvedorStrategy implements IProvedorStrategy {
  abstract readonly tipo: string
  abstract enviarMensagem(input: {
    apiKey: string
    mensagem: string
    modelo?: string
  }): Promise<string>

  protected async postJson<T>(
    url: string,
    headers: Record<string, string>,
    body: unknown
  ): Promise<T> {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const detalhe = await response.text()
      throw new ExcecaoApp(`Falha ao chamar ${this.tipo}: HTTP ${response.status} ${detalhe}`)
    }

    return response.json() as Promise<T>
  }
}
