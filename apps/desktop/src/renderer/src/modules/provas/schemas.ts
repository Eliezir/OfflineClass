import { z } from 'zod'

/** Form schema for creating/editing a prova's metadata. */
export const provaFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título').max(200),
  description: z.string().max(2000)
})
export type ProvaFormValues = z.infer<typeof provaFormSchema>

export type { ExamSummary } from '@offlineclass/shared'
