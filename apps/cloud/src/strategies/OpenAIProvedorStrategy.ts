import { ExcecaoApp } from '../exception/excecao-app'
import { BaseProvedorStrategy } from './BaseProvedorStrategy'
import type { MensagemProvedor } from './IProvedorStrategy'

type OpenAIResponse = {
  choices?: Array<{ message?: { content?: string } }>
}

export class OpenAIProvedorStrategy extends BaseProvedorStrategy {
  readonly tipo = 'openai'

  async enviarMensagem(input: MensagemProvedor): Promise<string> {
    const response = await this.postJson<OpenAIResponse>(
      'https://api.openai.com/v1/chat/completions',
      { Authorization: `Bearer ${input.apiKey}` },
      {
        model: input.modelo ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: input.mensagem }]
      }
    )

    const conteudo = response.choices?.[0]?.message?.content
    if (!conteudo) throw new ExcecaoApp('A OpenAI retornou uma resposta vazia')
    return conteudo
  }
}
