import { ZodError } from 'zod'
import { decryptApiKey, encryptApiKey } from '../config/crypto'
import { ProvedorDTO } from '../dto/ProvedorDTO'
import { ExcecaoApp } from '../exception/excecao-app'
import { ExcecaoNaoEncontrado } from '../exception/excecao-nao-encontrado'
import { ExcecaoValidacao } from '../exception/excecao-validacao'
import type { ChatRequest } from '../requests/ChatRequest'
import { ProvedorRequestSchema } from '../requests/ProvedorRequest'
import type { ProvedorRepository } from '../repositories/ProvedorRepository'
import type { ProvedorStrategyFactory } from '../strategies/ProvedorStrategyFactory'

export class ProvedorService {
  constructor(
    private readonly repository: ProvedorRepository,
    private readonly strategyFactory?: ProvedorStrategyFactory
  ) {}

  async criaProvedor(body: unknown) {
    try {
      const request = ProvedorRequestSchema.parse(body)
      const tipo = await this.repository.tipoPorId(request.tipoProvedorId)

      if (!tipo) {
        throw new ExcecaoValidacao('Tipo de provedor não encontrado')
      }

      const encrypted = encryptApiKey(request.apiKey)
      const dto = ProvedorDTO.porRequest({
        nome: request.nome,
        tipoProvedorId: request.tipoProvedorId,
        ...encrypted
      })

      return await this.repository.criar(dto)
    } catch (error) {
      this.trataErro(error, 'criar o provedor')
    }
  }

  async listarProvedores() {
    try {
      return await this.repository.listar()
    } catch (error) {
      this.trataErro(error, 'listar os provedores')
    }
  }

  async listarTipos() {
    try {
      return await this.repository.listarTipos()
    } catch (error) {
      this.trataErro(error, 'listar os tipos de provedor')
    }
  }

  async enviarMensagem(provedorId: number, request: ChatRequest): Promise<string> {
    try {
      const provedor = await this.repository.porIdComTipo(provedorId)

      if (!provedor) {
        throw new ExcecaoNaoEncontrado('Provedor não encontrado!')
      }

      if (!this.strategyFactory) {
        throw new ExcecaoApp('Strategy factory não configurada')
      }

      const strategy = this.strategyFactory.porTipo(provedor.provedor.nome)
      const apiKey = decryptApiKey(provedor)

      return await strategy.enviarMensagem({
        apiKey,
        mensagem: request.mensagem,
        modelo: request.modelo
      })
    } catch (error) {
      this.trataErro(error, 'enviar a mensagem ao provedor')
    }
  }

  private trataErro(error: unknown, operacao: string): never {
    if (error instanceof ExcecaoApp || error instanceof ZodError) {
      throw error
    }

    const detalhe = error instanceof Error ? error.message : 'erro desconhecido'
    throw new ExcecaoApp(`Não foi possível ${operacao}: ${detalhe}`)
  }
}
