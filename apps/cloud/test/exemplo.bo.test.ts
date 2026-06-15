import { describe, expect, it } from 'vitest'
import { ExemploBo } from '../src/services/exemplo.bo'
import type { ExemploDao } from '../src/repositories/exemplo.dao'

describe('ExemploBo', () => {
  it('mapeia as entidades do DAO para VOs de resposta', async () => {
    const fakeDao = {
      listar: () => Promise.resolve([{ id: 1, exemplo: 'Olá mundo' }])
    } as unknown as ExemploDao

    const bo = new ExemploBo(fakeDao)

    expect(await bo.listar()).toEqual([{ id: 1, exemplo: 'Olá mundo' }])
  })
})
