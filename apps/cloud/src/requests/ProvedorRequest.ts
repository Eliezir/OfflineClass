import { z } from 'zod'

export const ProvedorRequestSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, 'O nome precisa ter pelo menos 3 caracteres')
    .max(80, 'O nome pode ter até 80 caracteres'),
  apiKey: z
    .string()
    .trim()
    .min(8, 'A API Key precisa ter pelo menos 8 caracteres')
    .max(255, 'A API Key pode ter até 255 caracteres')
    .refine((value) => !value.includes(' '), 'A API Key não pode ter espaços'),
  tipoProvedorId: z.coerce.number().int('Tipo inválido!').positive('Tipo inválido')
})

export type ProvedorRequest = z.infer<typeof ProvedorRequestSchema>
