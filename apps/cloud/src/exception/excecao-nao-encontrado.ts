import { ExcecaoApp } from './excecao-app'

// Recurso inexistente → HTTP 404 (≈ ExcecaoNaoEncontrado do backend Java).
export class ExcecaoNaoEncontrado extends ExcecaoApp {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ExcecaoNaoEncontrado'
  }
}
