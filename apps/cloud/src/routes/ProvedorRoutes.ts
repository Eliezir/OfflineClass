import { Hono } from 'hono'
import type { ProvedorController } from '../controllers/ProvedorController'

export class ProvedorRoutes {
  constructor(private readonly controller: ProvedorController) {}

  routes(): Hono {
    const router = new Hono()

    router.post('/', (c) => this.controller.criar(c))
    router.get('/', (c) => this.controller.listar(c))
    router.get('/tipos', (c) => this.controller.listarTipos(c))
    router.post('/:id/chat', (c) => this.controller.enviarMensagem(c))

    return router
  }
}
