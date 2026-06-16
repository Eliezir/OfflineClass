import type { Prisma, PrismaClient, Provedor, TipoProvedor } from '@prisma/client'
import type { ProvedorDTO } from '../dto/ProvedorDTO'
import { ExcecaoNaoEncontrado } from '../exception/excecao-nao-encontrado'

export class ProvedorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  criar(dto: ProvedorDTO): Promise<Provedor> {
    return this.prisma.provedor.create({ data: dto.toJson() })
  }

  listar(): Promise<Provedor[]> {
    return this.prisma.provedor.findMany()
  }

  listarTipos(): Promise<TipoProvedor[]> {
    return this.prisma.tipoProvedor.findMany({ orderBy: { nome: 'asc' } })
  }

  tipoPorId(id: number): Promise<TipoProvedor | null> {
    return this.prisma.tipoProvedor.findFirst({ where: { id } })
  }

  porId(id: number): Promise<Provedor | null> {
    return this.prisma.provedor.findFirst({ where: { id } })
  }

  porIdComTipo(id: number): Promise<ProvedorComTipo | null> {
    return this.prisma.provedor.findFirst({
      where: { id },
      include: { provedor: true }
    })
  }

  porTipoProvedor(tipoProvedorId: number): Promise<Provedor[]> {
    return this.prisma.provedor.findMany({ where: { tipoProvedorId } })
  }

  async editar(id: number, novosDados: ProvedorDTO): Promise<Provedor> {
    const provedor = await this.porId(id)

    if (!provedor) {
      throw new ExcecaoNaoEncontrado('Provedor não encontrado!')
    }

    return this.prisma.provedor.update({
      where: { id: provedor.id },
      data: novosDados.toJson()
    })
  }

  async deletar(id: number): Promise<Provedor> {
    const provedor = await this.porId(id)

    if (!provedor) {
      throw new ExcecaoNaoEncontrado('Provedor não encontrado!')
    }

    return this.prisma.provedor.delete({
      where: { id: provedor.id }
    })
  }
}

export type ProvedorComTipo = Prisma.ProvedorGetPayload<{
  include: { provedor: true }
}>
