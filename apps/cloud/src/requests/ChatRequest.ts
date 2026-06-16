import { z } from 'zod'

export const ChatRequestSchema = z.object({
  mensagem: z.string().trim().min(1, 'A mensagem é obrigatória').max(20_000),
  modelo: z.string().trim().min(1).max(120).optional()
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
