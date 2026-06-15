import { ExcecaoApp } from './excecao-app'

// Erro de validação de negócio lançado manualmente nos BOs → HTTP 400
// (≈ ExcecaoValidacao do backend Java).
export class ExcecaoValidacao extends ExcecaoApp {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ExcecaoValidacao'
  }
}
