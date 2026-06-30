import type { AvatarConfig } from '@offlineclass/shared'

// ── DiceBear "adventurer" part catalog ───────────────────────────────────
// The single source of truth for which IDs exist, shared by the builder UI
// (student-web) and randomAvatar(). Labels/icons/grouping are a UI concern and
// live in the builder, not here.

const range = (prefix: string, n: number): string[] =>
  Array.from({ length: n }, (_, i) => prefix + String(i + 1).padStart(2, '0'))

export const SKIN_COLORS = ['ffe0bd', 'f2d3b1', 'ecad80', 'c68642', '9e5622', '763900', '4a2f1b']
export const HAIR_COLORS = [
  '0e0e0e', '562306', '6a4e35', '796a45', 'ab2a18', 'ac6511', 'cb6820',
  'b9a05f', 'e5d7a3', 'afafaf', '3eac2c', '85c2c6', 'dba3be', '592454'
]
export const BACKGROUND_COLORS = ['a5b4fc', 'c4f0d0', 'fde68a', 'fecaca', 'e9d5ff', 'bae6fd', 'f5f5f5']

export const HAIR_STYLES = [...range('long', 26), ...range('short', 19)]
export const EYES = range('variant', 26)
export const EYEBROWS = range('variant', 15)
export const MOUTHS = range('variant', 30)
export const GLASSES = range('variant', 5)
export const EARRINGS = range('variant', 6)
export const FEATURES = ['freckles', 'blush', 'birthmark', 'mustache']

export const DEFAULT_AVATAR: AvatarConfig = {
  skinColor: 'ecad80',
  hair: 'long03',
  hairColor: '6a4e35',
  eyes: 'variant01',
  eyebrows: 'variant01',
  mouth: 'variant07',
  glasses: '',
  earrings: '',
  features: '',
  backgroundColor: 'a5b4fc'
}

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** A random-but-pleasant avatar — used when a student skips the builder. */
export function randomAvatar(): AvatarConfig {
  return {
    skinColor: pick(SKIN_COLORS),
    hair: pick(HAIR_STYLES),
    hairColor: pick(HAIR_COLORS),
    eyes: pick(EYES),
    eyebrows: pick(EYEBROWS),
    mouth: pick(MOUTHS),
    glasses: Math.random() < 0.3 ? pick(GLASSES) : '',
    earrings: Math.random() < 0.3 ? pick(EARRINGS) : '',
    features: Math.random() < 0.3 ? pick(FEATURES) : '',
    backgroundColor: pick(BACKGROUND_COLORS)
  }
}
