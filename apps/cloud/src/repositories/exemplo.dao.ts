import type { Exemplo, PrismaClient } from '@prisma/client'

// Camada de acesso a dados (≈ ExemploDAO/JpaRepository do Java). Recebe o
// PrismaClient por injeção de dependência via construtor.
export class ExemploDao {
  constructor(private readonly prisma: PrismaClient) {}

  listar(): Promise<Exemplo[]> {
    return this.prisma.exemplo.findMany({ orderBy: { id: 'asc' } })
  }

  criar(exemplo: string): Promise<Exemplo> {
    return this.prisma.exemplo.create({ data: { exemplo } })
  }
}
