import 'dotenv/config'

// Substitui os application-{dev,prod,test}.properties do Spring: o perfil é
// resolvido a partir de NODE_ENV e o restante vem do .env (carregado acima).
export type Profile = 'development' | 'production' | 'test'

function resolveProfile(): Profile {
  const value = process.env.NODE_ENV
  if (value === 'production' || value === 'test') return value
  return 'development'
}

const profile = resolveProfile()

export const env = {
  profile,
  isProduction: profile === 'production',
  isTest: profile === 'test',
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? ''
}
