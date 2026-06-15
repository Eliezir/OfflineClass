import { z } from 'zod'

// VO imutável de transporte (≈ Models/VO record + Spring Validator no Java).
// O schema zod é tanto a validação quanto a fonte do tipo.
export const exemploVoSchema = z.object({
  id: z.number().int(),
  exemplo: z.string()
})

export type ExemploVO = z.infer<typeof exemploVoSchema>
