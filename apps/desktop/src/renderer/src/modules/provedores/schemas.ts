import { z } from 'zod'

export const provedorSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string(),
  tipoProvedorId: z.number().int().positive(),
  createdAt: z.coerce.date()
})

export const provedorListSchema = z.array(provedorSchema)

export const tipoProvedorSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1)
})

export const tipoProvedorListSchema = z.array(tipoProvedorSchema)

export const criaProvedorSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'O nome precisa ter pelo menos 3 caracteres')
    .max(80, 'O nome pode ter ate 80 caracteres'),
  apiKey: z
    .string()
    .trim()
    .min(8, 'A API key precisa ter pelo menos 8 caracteres')
    .max(255, 'A API key pode ter ate 255 caracteres')
    .refine((value) => !value.includes(' '), 'A API key nao pode ter espacos'),
  tipoProvedorId: z.number().int('Informe um ID inteiro').positive('Informe um ID valido')
})

export type Provedor = z.infer<typeof provedorSchema>
export type TipoProvedor = z.infer<typeof tipoProvedorSchema>
export type CriaProvedorInput = z.infer<typeof criaProvedorSchema>
