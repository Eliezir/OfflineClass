import { afterAll, afterEach } from 'vitest'
import { prisma } from '../src/config/prisma'

// Limpa as tabelas entre os testes para isolá-los (o DATABASE_URL de teste é
// injetado pelo vitest.config.ts; o schema é criado em global-setup.ts).
afterEach(async () => {
  await prisma.provedor.deleteMany()
  await prisma.tipoProvedor.deleteMany()
  await prisma.exemplo.deleteMany()
})

afterAll(async () => {
  await prisma.$disconnect()
})
