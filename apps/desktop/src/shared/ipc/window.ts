import { z } from 'zod'

export const WindowMinimizeInputSchema = z.undefined()
export const WindowMinimizeOutputSchema = z.void()

export const WindowMaximizeToggleInputSchema = z.undefined()
export const WindowMaximizeToggleOutputSchema = z.object({
  isMaximized: z.boolean()
})

export const WindowCloseInputSchema = z.undefined()
export const WindowCloseOutputSchema = z.void()

export const WindowIsMaximizedInputSchema = z.undefined()
export const WindowIsMaximizedOutputSchema = z.object({
  isMaximized: z.boolean()
})

/* Payload pushed from main whenever the window's maximize state changes. */
export const WindowMaximizeChangedEventSchema = z.object({
  isMaximized: z.boolean()
})
