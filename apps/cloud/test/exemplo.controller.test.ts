import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import { createApp } from '../src/app'

describe('GET /api/exemplo', () => {
  it('retorna 200 e a lista de exemplos em JSON', async () => {
    await prisma.exemplo.create({ data: { exemplo: 'Olá mundo' } })

    const app = createApp(prisma)
    const res = await app.request('/api/exemplo')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: expect.any(Number), exemplo: 'Olá mundo' }])
  })

  it('GET /api/health responde ok', async () => {
    const app = createApp(prisma)
    const res = await app.request('/api/health')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok' })
  })
})
