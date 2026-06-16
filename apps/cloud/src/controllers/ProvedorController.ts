import type { Context } from 'hono'
import { ProvedorService } from '../services/ProvedorService'
import { ChatRequestSchema } from '../requests/ChatRequest'
import { ExcecaoValidacao } from '../exception/excecao-validacao'

type ProvedorPublicavel = {
  id: number
  nome: string
  createdAt: Date
  tipoProvedorId: number
}

function sanitizaProvedor(provedor: ProvedorPublicavel) {
  return {
    id: provedor.id,
    nome: provedor.nome,
    createdAt: provedor.createdAt,
    tipoProvedorId: provedor.tipoProvedorId
  }
}

export class ProvedorController {
  constructor(private readonly service: ProvedorService) {}

  async criar(c: Context) {
    const provedor = await this.service.criaProvedor(await c.req.json())
    return c.json(sanitizaProvedor(provedor), 201)
  }

  async listar(c: Context) {
    const provedores = await this.service.listarProvedores()
    return c.json(provedores.map(sanitizaProvedor))
  }

  async listarTipos(c: Context) {
    return c.json(await this.service.listarTipos())
  }

  async enviarMensagem(c: Context) {
    const provedorId = Number(c.req.param('id'))
    if (!Number.isInteger(provedorId) || provedorId <= 0) {
      throw new ExcecaoValidacao('ID do provedor inválido')
    }

    const request = ChatRequestSchema.parse(await c.req.json())
    const resposta = await this.service.enviarMensagem(provedorId, request)
    return c.json({ resposta })
  }
}
