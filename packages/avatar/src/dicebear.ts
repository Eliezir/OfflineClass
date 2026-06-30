import { createAvatar } from '@dicebear/core'
import { adventurer } from '@dicebear/collection'
import type { AvatarConfig } from '@offlineclass/shared'

/** Render an AvatarConfig to an SVG string. Offline — the art ships inside
    `@dicebear/collection` (adventurer), only the IDs come from the config.

    `background: false` renders a transparent avatar (the container paints the
    colour — used by the builder preview/tiles); the default renders the
    chosen background so the SVG fills a circle on its own. */
export function avatarSvg(config: AvatarConfig, opts?: { background?: boolean }): string {
  const transparent = opts?.background === false
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const o: Record<string, any> = {
    seed: 'offlineclass',
    radius: 0,
    backgroundColor: [transparent ? 'transparent' : config.backgroundColor || 'transparent'],
    skinColor: [config.skinColor],
    hairColor: [config.hairColor],
    eyes: [config.eyes],
    eyebrows: [config.eyebrows],
    mouth: [config.mouth]
  }
  if (config.hair) { o.hair = [config.hair]; o.hairProbability = 100 } else { o.hairProbability = 0 }
  if (config.glasses) { o.glasses = [config.glasses]; o.glassesProbability = 100 } else { o.glassesProbability = 0 }
  if (config.earrings) { o.earrings = [config.earrings]; o.earringsProbability = 100 } else { o.earringsProbability = 0 }
  if (config.features) { o.features = [config.features]; o.featuresProbability = 100 } else { o.featuresProbability = 0 }

  // Force the root <svg> to fill its container regardless of app CSS.
  return createAvatar(adventurer, o)
    .toString()
    .replace('<svg ', '<svg width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block" ')
}
