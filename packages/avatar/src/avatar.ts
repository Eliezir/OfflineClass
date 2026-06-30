import { createElement } from 'react'
import type { CSSProperties, ReactElement } from 'react'
import type { AvatarConfig } from '@offlineclass/shared'
import { avatarSvg } from './dicebear'

export interface AvatarProps {
  config: AvatarConfig
  /** Pixel size of the (square) avatar. Defaults to 40. */
  size?: number
  /** Corner rounding — 'full' (circle, default), 'lg', or a pixel radius. */
  rounded?: 'full' | 'lg' | number
  className?: string
}

function radiusFor(rounded: AvatarProps['rounded']): string {
  if (rounded === 'lg') return '18px'
  if (typeof rounded === 'number') return `${rounded}px`
  return '9999px'
}

/**
 * Renders a student's avatar from its config. The same component is used in
 * both apps (student-web + teacher desktop). Written without JSX so the
 * workspace package needs no JSX transform.
 *
 * The chosen background colour paints the container; the avatar art is rendered
 * transparent on top, so it always fills a clean circle/rounded square.
 */
export function Avatar({ config, size = 40, rounded = 'full', className }: AvatarProps): ReactElement {
  const style: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radiusFor(rounded),
    overflow: 'hidden',
    flexShrink: 0,
    display: 'inline-block',
    background: `#${config.backgroundColor || 'a5b4fc'}`
  }
  return createElement('span', {
    className,
    style,
    'aria-hidden': true,
    dangerouslySetInnerHTML: { __html: avatarSvg(config, { background: false }) }
  })
}
