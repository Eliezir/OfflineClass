import { PrismaClient } from '@prisma/client'

// Cliente Prisma único da aplicação (substitui o EntityManager/DataSource do JPA).
// A URL do banco vem de DATABASE_URL (.env).
export const prisma = new PrismaClient()
