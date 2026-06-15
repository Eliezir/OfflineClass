/* Visual-model presentation themes for the generated deck, fitted to
   "Apollo 11 — A Chegada à Lua". Each theme lays a tinted scrim over the same
   NASA hero photo, so they all read as real title slides while staying
   distinct: two dark models (Cosmos, Órbita) and a light one (Solar). */

import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'

export type SlideTheme = {
  id: string
  name: MessageDescriptor
  /** One-line descriptor shown in the picker card. */
  blurb: MessageDescriptor
  /** Light slides flip the on-slide toggle icon to a sun (vs a moon). */
  light?: boolean
  /** Gradient scrim laid over the hero photo so the title text stays legible. */
  scrim: string
  /** Solid fallback shown behind the photo (and used by tiny thumbnails). */
  bg: string
  fg: string
  muted: string
  accent: string
  serif?: boolean
}

export const THEMES: SlideTheme[] = [
  {
    id: 'cosmos',
    name: msg`Cosmos`,
    blurb: msg`Fundo estelar · dourado`,
    scrim:
      'linear-gradient(to top, oklch(0.13 0.06 285 / 0.96) 14%, oklch(0.13 0.06 285 / 0.35) 52%, oklch(0.13 0.06 285 / 0))',
    bg: 'oklch(0.13 0.06 285)',
    fg: 'oklch(0.98 0.02 90)',
    muted: 'oklch(0.98 0.02 90 / 0.68)',
    accent: 'oklch(0.83 0.13 82)'
  },
  {
    id: 'orbita',
    name: msg`Órbita`,
    blurb: msg`Escuro técnico · ciano`,
    scrim:
      'linear-gradient(to top, oklch(0.17 0.03 250 / 0.96) 14%, oklch(0.17 0.03 250 / 0.3) 55%, oklch(0.17 0.03 250 / 0))',
    bg: 'oklch(0.17 0.03 250)',
    fg: 'oklch(0.97 0.01 240)',
    muted: 'oklch(0.97 0.01 240 / 0.66)',
    accent: 'oklch(0.82 0.13 205)'
  },
  {
    id: 'solar',
    name: msg`Solar`,
    blurb: msg`Fundo claro · âmbar`,
    light: true,
    scrim:
      'linear-gradient(to top, oklch(0.98 0.012 95 / 0.97) 22%, oklch(0.98 0.012 95 / 0.5) 56%, oklch(0.98 0.012 95 / 0))',
    bg: 'oklch(0.98 0.012 95)',
    fg: 'oklch(0.24 0.02 60)',
    muted: 'oklch(0.46 0.03 60)',
    accent: 'oklch(0.6 0.17 50)'
  }
]
