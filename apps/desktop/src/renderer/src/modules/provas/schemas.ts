import { z } from 'zod'

/** Form schema for creating/editing a prova's metadata. */
export const provaFormSchema = z.object({
  title: z.string().trim().min(1, 'Informe um título').max(200),
  description: z.string().max(2000),
  subject: z.string().trim().max(120),
  gradeLevel: z.string().trim().max(120),
  icon: z.string().max(16)
})
export type ProvaFormValues = z.infer<typeof provaFormSchema>

export type { ExamSummary } from '@offlineclass/shared'
