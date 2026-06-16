import { describe, expect, it } from 'vitest'
import { prisma } from '../src/config/prisma'
import { ExemploDao } from '../src/repositories/exemplo.dao'

describe('ExemploDao', () => {
  it('persiste e lista exemplos em ordem de id', async () => {
    const dao = new ExemploDao(prisma)

    await dao.criar('Olá mundo')
    await dao.criar('Segundo')

    const todos = await dao.listar()

    expect(todos).toHaveLength(2)
    expect(todos[0].exemplo).toBe('Olá mundo')
    expect(todos[1].exemplo).toBe('Segundo')
  })

  it('lista vazia quando não há registros', async () => {
    const dao = new ExemploDao(prisma)
    expect(await dao.listar()).toEqual([])
  })
})
