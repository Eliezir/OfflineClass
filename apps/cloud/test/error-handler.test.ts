import { describe, expect, it } from 'vitest'
import { Hono } from 'hono'
import { z } from 'zod'
import { errorHandler } from '../src/exception/error-handler'
import type { ErroResponse } from '../src/exception/erro-response'
import { ExcecaoApp } from '../src/exception/excecao-app'
import { ExcecaoNaoEncontrado } from '../src/exception/excecao-nao-encontrado'
import { ExcecaoValidacao } from '../src/exception/excecao-validacao'

// Monta um app mínimo cuja única rota lança o erro recebido, exercitando o
// error-handler real (≈ GlobalExceptionHandler) através do app.request do Hono.
function appThatThrows(err: unknown) {
  const app = new Hono()
  app.onError(errorHandler)
  app.get('/boom', () => {
    throw err
  })
  return app
}

describe('errorHandler (GlobalExceptionHandler)', () => {
  it('404 para ExcecaoNaoEncontrado', async () => {
    const res = await appThatThrows(new ExcecaoNaoEncontrado('Recurso X não existe')).request(
      '/boom'
    )

    expect(res.status).toBe(404)
    const body = (await res.json()) as ErroResponse
    expect(body).toMatchObject({
      status: 404,
      erro: 'Recurso não encontrado',
      mensagens: ['Recurso X não existe']
    })
    expect(typeof body.timestamp).toBe('string')
  })

  it('400 para ExcecaoValidacao', async () => {
    const res = await appThatThrows(new ExcecaoValidacao('campo inválido')).request('/boom')

    expect(res.status).toBe(400)
    const body = (await res.json()) as ErroResponse
    expect(body.erro).toBe('Erro de validação')
  })

  it('400 para ZodError com uma mensagem por campo', async () => {
    let zodError: unknown
    try {
      z.object({ nome: z.string() }).parse({})
    } catch (err) {
      zodError = err
    }

    const res = await appThatThrows(zodError).request('/boom')

    expect(res.status).toBe(400)
    const body = (await res.json()) as ErroResponse
    expect(body.erro).toBe('Erro de validação')
    expect(body.mensagens[0]).toContain('nome')
  })

  it('500 para ExcecaoApp genérica', async () => {
    const res = await appThatThrows(new ExcecaoApp('falhou')).request('/boom')

    expect(res.status).toBe(500)
    const body = (await res.json()) as ErroResponse
    expect(body.erro).toBe('Erro interno da aplicação')
  })

  it('500 para erro não tratado', async () => {
    const res = await appThatThrows(new Error('inesperado')).request('/boom')

    expect(res.status).toBe(500)
  })
})
