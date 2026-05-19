import { z } from 'zod'

export const DiscoveryStatus = z.object({
  lanIp: z.string(),
  port: z.number().int().positive(),
  mdnsName: z.string(),
  qrDataUrl: z.string()
})
export type DiscoveryStatus = z.infer<typeof DiscoveryStatus>

export const Teacher = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string()
})
export type Teacher = z.infer<typeof Teacher>

export const RegisterInput = z.object({
  email: z.string().email('E-mail inválido'),
  name: z.string().min(2, 'Mínimo 2 caracteres').max(80),
  password: z.string().min(8, 'Mínimo 8 caracteres').max(200)
})
export type RegisterInput = z.infer<typeof RegisterInput>

export const LoginInput = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(1, 'Obrigatório')
})
export type LoginInput = z.infer<typeof LoginInput>
