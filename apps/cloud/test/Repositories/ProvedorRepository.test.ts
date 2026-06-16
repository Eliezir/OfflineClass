import { describe, expect, it, vi, beforeEach } from 'vitest'
import { prisma } from '../../src/config/prisma'
import { ProvedorDTO } from '../../src/dto/ProvedorDTO'
import { ProvedorRepository } from '../../src/repositories/ProvedorRepository'

vi.mock('../../src/config/prisma', () => ({
  prisma: {
    provedor: {
      create: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      findFirst: vi.fn()
    }
  }
}))

describe('ProvedorRepository', () => {
  const repository = new ProvedorRepository(prisma)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('deve criar um provedor', async () => {
    const dto = ProvedorDTO.porRequest({
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    })

    const provedorCriado = {
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    }

    const mockCriacao = vi.mocked(prisma.provedor.create)
    mockCriacao.mockResolvedValue(provedorCriado as never)

    const resultado = await repository.criar(dto)

    expect(mockCriacao).toHaveBeenCalledWith({
      data: dto.toJson()
    })
    expect(resultado).toEqual(provedorCriado)
  })

  it('deve listar os provedores', async () => {
    const mockLista = vi.mocked(prisma.provedor.findMany)
    mockLista.mockResolvedValue([
      {
        id: 1,
        nome: 'Open AI',
        apiKeyEncrypted: 'encrypted',
        apiKeyIv: 'iv',
        apiKeyAuthTag: 'tag',
        tipoProvedorId: 1
      },
      {
        id: 2,
        nome: 'Claude',
        apiKeyEncrypted: 'encrypted-2',
        apiKeyIv: 'iv-2',
        apiKeyAuthTag: 'tag-2',
        tipoProvedorId: 2
      }
    ] as never)

    const resultados = await repository.listar()

    expect(mockLista).toHaveBeenCalledWith()
    expect(resultados).toEqual([
      {
        id: 1,
        nome: 'Open AI',
        apiKeyEncrypted: 'encrypted',
        apiKeyIv: 'iv',
        apiKeyAuthTag: 'tag',
        tipoProvedorId: 1
      },
      {
        id: 2,
        nome: 'Claude',
        apiKeyEncrypted: 'encrypted-2',
        apiKeyIv: 'iv-2',
        apiKeyAuthTag: 'tag-2',
        tipoProvedorId: 2
      }
    ])
  })

  it('deve pesquisar por id', async () => {
    const mockPesquisa = vi.mocked(prisma.provedor.findFirst)
    mockPesquisa.mockResolvedValue({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    } as never)

    const resultado = await repository.porId(1)

    expect(mockPesquisa).toHaveBeenCalledWith({
      where: { id: 1 }
    })
    expect(resultado).toEqual({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    })
  })

  it('deve retornar provedores por tipo', async () => {
    const mockPesquisa = vi.mocked(prisma.provedor.findMany)
    mockPesquisa.mockResolvedValue([
      {
        id: 1,
        nome: 'Open AI',
        apiKeyEncrypted: 'encrypted',
        apiKeyIv: 'iv',
        apiKeyAuthTag: 'tag',
        tipoProvedorId: 1
      }
    ] as never)

    const resultados = await repository.porTipoProvedor(1)

    expect(mockPesquisa).toHaveBeenCalledWith({
      where: { tipoProvedorId: 1 }
    })
    expect(resultados).toEqual([
      {
        id: 1,
        nome: 'Open AI',
        apiKeyEncrypted: 'encrypted',
        apiKeyIv: 'iv',
        apiKeyAuthTag: 'tag',
        tipoProvedorId: 1
      }
    ])
  })

  it('deve editar um provedor', async () => {
    const dto = ProvedorDTO.porRequest({
      nome: 'Open AI',
      apiKeyEncrypted: 'updated-encrypted',
      apiKeyIv: 'updated-iv',
      apiKeyAuthTag: 'updated-tag',
      tipoProvedorId: 1
    })

    vi.mocked(prisma.provedor.findFirst).mockResolvedValue({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    } as never)

    vi.mocked(prisma.provedor.update).mockResolvedValue({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'updated-encrypted',
      apiKeyIv: 'updated-iv',
      apiKeyAuthTag: 'updated-tag',
      tipoProvedorId: 1
    } as never)

    const resultado = await repository.editar(1, dto)

    expect(prisma.provedor.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: dto.toJson()
    })
    expect(resultado).toEqual({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'updated-encrypted',
      apiKeyIv: 'updated-iv',
      apiKeyAuthTag: 'updated-tag',
      tipoProvedorId: 1
    })
  })

  it('deve excluir um provedor', async () => {
    vi.mocked(prisma.provedor.findFirst).mockResolvedValue({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    } as never)

    vi.mocked(prisma.provedor.delete).mockResolvedValue({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    } as never)

    const resultado = await repository.deletar(1)

    expect(prisma.provedor.delete).toHaveBeenCalledWith({
      where: { id: 1 }
    })
    expect(resultado).toEqual({
      id: 1,
      nome: 'Open AI',
      apiKeyEncrypted: 'encrypted',
      apiKeyIv: 'iv',
      apiKeyAuthTag: 'tag',
      tipoProvedorId: 1
    })
  })
})
