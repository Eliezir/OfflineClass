import { ExcecaoApp } from '../exception/excecao-app'
import { BaseProvedorStrategy } from './BaseProvedorStrategy'
import type { MensagemProvedor } from './IProvedorStrategy'

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>
}

export class AnthropicProvedorStrategy extends BaseProvedorStrategy {
  readonly tipo = 'anthropic'

  async enviarMensagem(input: MensagemProvedor): Promise<string> {
    const response = await this.postJson<AnthropicResponse>(
      'https://api.anthropic.com/v1/messages',
      {
        'x-api-key': input.apiKey,
        'anthropic-version': '2023-06-01'
      },
      {
        model: input.modelo ?? 'claude-3-5-haiku-latest',
        max_tokens: 4096,
        messages: [{ role: 'user', content: input.mensagem }]
      }
    )

    const conteudo = response.content?.find((item) => item.type === 'text')?.text
    if (!conteudo) throw new ExcecaoApp('A Anthropic retornou uma resposta vazia')
    return conteudo
  }
}
