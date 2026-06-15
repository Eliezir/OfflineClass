import { serve } from '@hono/node-server'
import { env } from './config/env'
import { prisma } from './config/prisma'
import { createApp } from './app'

// Ponto de entrada (≈ ApresentaIaApplication.main do Spring Boot).
const app = createApp(prisma)

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`OfflineClass backend [${env.profile}] ouvindo em http://localhost:${info.port}`)
})
