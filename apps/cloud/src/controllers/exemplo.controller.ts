import { Hono } from 'hono'
import type { ExemploBo } from '../services/exemplo.bo'

export function exemploController(bo: ExemploBo): Hono {
  const router = new Hono()

  router.get('/', async (c) => {
    const exemplos = await bo.listar()
    return c.json(exemplos)
  })

  return router
}
