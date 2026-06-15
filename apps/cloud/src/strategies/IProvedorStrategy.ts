export type MensagemProvedor = {
  apiKey: string
  mensagem: string
  modelo?: string
}

export interface IProvedorStrategy {
  readonly tipo: string
  enviarMensagem(input: MensagemProvedor): Promise<string>
}
