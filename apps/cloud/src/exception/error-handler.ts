import type { Context } from 'hono'
import { ZodError } from 'zod'
import { ExcecaoApp } from './excecao-app'
import { ExcecaoNaoEncontrado } from './excecao-nao-encontrado'
import { ExcecaoValidacao } from './excecao-validacao'
import { erroResponse } from './erro-response'

// Tratamento central de erros (≈ GlobalExceptionHandler do Spring), registrado
// via app.onError. Cada ramo espelha um @ExceptionHandler do backend Java.
export function errorHandler(err: Error, c: Context): Response {
  // Falha de validação de DTO (zod) → 400 com uma mensagem por campo.
  if (err instanceof ZodError) {
    const mensagens = err.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    return c.json(erroResponse(400, 'Erro de validação', mensagens), 400)
  }

  if (err instanceof ExcecaoNaoEncontrado) {
    return c.json(erroResponse(404, 'Recurso não encontrado', [err.message]), 404)
  }

  if (err instanceof ExcecaoValidacao) {
    return c.json(erroResponse(400, 'Erro de validação', [err.message]), 400)
  }

  if (err instanceof ExcecaoApp) {
    return c.json(erroResponse(500, 'Erro interno da aplicação', [err.message]), 500)
  }

  // Qualquer outro erro não previsto.
  return c.json(erroResponse(500, 'Erro interno da aplicação', [err.message]), 500)
}
