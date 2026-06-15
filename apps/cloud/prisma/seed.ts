import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const tiposPadrao = ['OpenAI', 'Anthropic'] as const

async function main() {
  await Promise.all(
    tiposPadrao.map((nome) =>
      prisma.tipoProvedor.upsert({
        where: { nome },
        update: {},
        create: { nome }
      })
    )
  )

  console.log(`Tipos de provedor disponíveis: ${tiposPadrao.join(', ')}`)
}

main()
  .catch((error) => {
    console.error('Não foi possível criar os tipos de provedor:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
