import { beforeEach, describe, expect, it, vi } from 'vitest'
import { decryptApiKey } from '../src/config/crypto'
import { ProvedorService } from '../src/services/ProvedorService'

describe('ProvedorService', () => {
  beforeEach(() => {
    process.env.API_KEY_ENCRYPTION_KEY_BASE64 = Buffer.alloc(32, 1).toString('base64')
    vi.clearAllMocks()
  })

  it('deve criptografar a apiKey antes de persistir', async () => {
    const repository = {
      criar: vi.fn().mockResolvedValue({ id: 1 }),
      tipoPorId: vi.fn().mockResolvedValue({ id: 1, nome: 'OpenAI' })
    }

    const service = new ProvedorService(repository as never)
    const body = {
      nome: 'Open AI',
      apiKey: '12345678',
      tipoProvedorId: 1
    }

    const resultado = await service.criaProvedor(body)

    expect(repository.criar).toHaveBeenCalledTimes(1)

    const dtoRecebido = repository.criar.mock.calls[0][0]
    const payload = dtoRecebido.toJson()

    expect(payload.nome).toBe('Open AI')
    expect(payload.tipoProvedorId).toBe(1)
    expect(payload.apiKeyEncrypted).not.toBe(body.apiKey)
    expect(decryptApiKey(payload)).toBe(body.apiKey)
    expect(resultado).toEqual({ id: 1 })
  })

  it('deve rejeitar criação com tipo inexistente', async () => {
    const repository = {
      criar: vi.fn(),
      tipoPorId: vi.fn().mockResolvedValue(null)
    }
    const service = new ProvedorService(repository as never)

    await expect(
      service.criaProvedor({
        nome: 'Open AI',
        apiKey: '12345678',
        tipoProvedorId: 999
      })
    ).rejects.toThrow('Tipo de provedor não encontrado')

    expect(repository.criar).not.toHaveBeenCalled()
  })

  it('deve decriptar a apiKey e delegar a mensagem para a estratégia', async () => {
    const { encryptApiKey } = await import('../src/config/crypto')
    const encrypted = encryptApiKey('sk-segredo')
    const strategy = {
      enviarMensagem: vi.fn().mockResolvedValue('resposta da IA')
    }
    const repository = {
      porIdComTipo: vi.fn().mockResolvedValue({
        id: 1,
        nome: 'Conta OpenAI',
        tipoProvedorId: 1,
        provedor: { id: 1, nome: 'OpenAI' },
        ...encrypted
      })
    }
    const factory = {
      porTipo: vi.fn().mockReturnValue(strategy)
    }
    const service = new ProvedorService(repository as never, factory as never)

    const resposta = await service.enviarMensagem(1, { mensagem: 'Olá' })

    expect(factory.porTipo).toHaveBeenCalledWith('OpenAI')
    expect(strategy.enviarMensagem).toHaveBeenCalledWith({
      apiKey: 'sk-segredo',
      mensagem: 'Olá',
      modelo: undefined
    })
    expect(resposta).toBe('resposta da IA')
  })

  it('deve converter falhas inesperadas do repository em ExcecaoApp', async () => {
    const repository = {
      listar: vi.fn().mockRejectedValue(new Error('banco indisponível'))
    }
    const service = new ProvedorService(repository as never)

    await expect(service.listarProvedores()).rejects.toThrow(
      'Não foi possível listar os provedores: banco indisponível'
    )
  })
})
