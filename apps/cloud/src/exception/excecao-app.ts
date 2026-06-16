// Base de todas as exceções de negócio (≈ ExcecaoApp do backend Java).
// Mapeada para HTTP 500 pelo error-handler quando não for uma subclasse tratada.
export class ExcecaoApp extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ExcecaoApp'
  }
}
