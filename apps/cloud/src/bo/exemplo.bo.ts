import type { ExemploDao } from '../dao/exemplo.dao'
import type { ExemploVO } from '../models/vo/exemplo.vo'

// Regra de negócio (≈ ExemploBO/@Service do Java). Depende apenas do DAO,
// nunca do Prisma diretamente — mapeia entidades para VOs de resposta.
export class ExemploBo {
  constructor(private readonly dao: ExemploDao) {}

  async listar(): Promise<ExemploVO[]> {
    const entidades = await this.dao.listar()
    return entidades.map((entidade) => ({
      id: entidade.id,
      exemplo: entidade.exemplo
    }))
  }
}
