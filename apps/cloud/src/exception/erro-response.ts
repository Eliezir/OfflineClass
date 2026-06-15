// Contrato de erro idêntico ao ErroResponse (record) do backend Java.
export interface ErroResponse {
  timestamp: string
  status: number
  erro: string
  mensagens: string[]
}

export function erroResponse(status: number, erro: string, mensagens: string[]): ErroResponse {
  return {
    timestamp: new Date().toISOString(),
    status,
    erro,
    mensagens
  }
}
