import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../src/app'
import { prisma } from '../src/config/prisma'

describe('ProvedorController', () => {
  let tipoOpenAIId: number

  beforeEach(async () => {
    process.env.API_KEY_ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64')
    tipoOpenAIId = (await prisma.tipoProvedor.create({ data: { nome: 'OpenAI' } })).id
  })

  it('POST /api/provedores cria sem expor os campos secretos', async () => {
    const app = createApp(prisma)
    const res = await app.request('/api/provedores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nome: 'Conta OpenAI',
        apiKey: 'sk-segredo',
        tipoProvedorId: tipoOpenAIId
      })
    })

    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({
      id: expect.any(Number),
      nome: 'Conta OpenAI',
      tipoProvedorId: tipoOpenAIId
    })

    const salvo = await prisma.provedor.findFirstOrThrow()
    expect(salvo.apiKeyEncrypted).not.toBe('sk-segredo')
  })

  it('GET /api/provedores lista sem expor os campos secretos', async () => {
    await prisma.provedor.create({
      data: {
        nome: 'Conta OpenAI',
        apiKeyEncrypted: 'encrypted',
        apiKeyIv: 'iv',
        apiKeyAuthTag: 'tag',
        tipoProvedorId: tipoOpenAIId
      }
    })

    const app = createApp(prisma)
    const res = await app.request('/api/provedores')
    const body = (await res.json()) as Array<Record<string, unknown>>

    expect(res.status).toBe(200)
    expect(body).toEqual([
      expect.objectContaining({ nome: 'Conta OpenAI', tipoProvedorId: tipoOpenAIId })
    ])
    expect(body[0]).not.toHaveProperty('apiKeyEncrypted')
    expect(body[0]).not.toHaveProperty('apiKeyIv')
    expect(body[0]).not.toHaveProperty('apiKeyAuthTag')
  })

  it('GET /api/provedores retorna array vazio quando não há provedores', async () => {
    const app = createApp(prisma)
    const res = await app.request('/api/provedores')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })

  it('GET /api/provedores/tipos lista os tipos disponíveis', async () => {
    const app = createApp(prisma)
    const res = await app.request('/api/provedores/tipos')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: tipoOpenAIId, nome: 'OpenAI' }])
  })

  it('POST /api/provedores/:id/chat rejeita ID inválido', async () => {
    const app = createApp(prisma)
    const res = await app.request('/api/provedores/invalido/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mensagem: 'Olá' })
    })

    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({
      erro: 'Erro de validação',
      mensagens: ['ID do provedor inválido']
    })
  })
})
