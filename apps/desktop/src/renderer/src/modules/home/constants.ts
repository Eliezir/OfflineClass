import type { Tone } from './types'

export const toneChip: Record<Tone, string> = {
  primary: 'bg-primary-soft text-primary-soft-foreground',
  secondary: 'bg-secondary-soft text-secondary-soft-foreground',
  tertiary: 'bg-tertiary-soft text-tertiary-soft-foreground',
  quaternary: 'bg-quaternary-soft text-quaternary-soft-foreground'
}

export const PREVIEW = {
  presentations: 4,
  slideModels: 4,
  visualModels: 3
}

export const cardFill = 'flex min-h-0 flex-col'
