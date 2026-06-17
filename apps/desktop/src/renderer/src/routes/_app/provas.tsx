import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { ProvasPage } from '@renderer/modules/provas/components/provas-page'

// `?new=true` (set by the command palette) opens the create dialog on arrival.
const searchSchema = z.object({
  new: z.boolean().optional()
})

export const Route = createFileRoute('/_app/provas')({
  validateSearch: searchSchema,
  component: ProvasPage
})
