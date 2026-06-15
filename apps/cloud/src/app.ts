import { Hono } from 'hono'
import type { PrismaClient } from '@prisma/client'
import { corsMiddleware } from './config/cors'
import { errorHandler } from './exception/error-handler'
import { ProvedorRepository } from './repositories/ProvedorRepository'
import { ProvedorService } from './services/ProvedorService'
import { ProvedorController } from './controllers/ProvedorController'
import { ProvedorStrategyFactory } from './strategies/ProvedorStrategyFactory'
import { ProvedorRoutes } from './routes/ProvedorRoutes'
import { ExemploDao } from './repositories/exemplo.dao'
import { ExemploBo } from './services/exemplo.bo'
import { exemploController } from './controllers/exemplo.controller'

export function createApp(prisma: PrismaClient): Hono {
  const app = new Hono()

  app.use('/api/*', corsMiddleware)
  app.onError(errorHandler)

  app.get('/api/health', (c) => c.json({ status: 'ok' }))

  const exemploDao = new ExemploDao(prisma)
  const exemploBo = new ExemploBo(exemploDao)
  app.route('/api/exemplo', exemploController(exemploBo))

  const provedorRepository = new ProvedorRepository(prisma)
  const strategyFactory = new ProvedorStrategyFactory()
  const provedorService = new ProvedorService(provedorRepository, strategyFactory)
  const provedorController = new ProvedorController(provedorService)
  const provedorRoutes = new ProvedorRoutes(provedorController)
  app.route('/api/provedores', provedorRoutes.routes())

  return app
}
