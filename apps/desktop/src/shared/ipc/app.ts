import { z } from 'zod'

export const AppGetVersionInputSchema = z.undefined()

export const AppGetVersionOutputSchema = z.object({
  version: z.string()
})
