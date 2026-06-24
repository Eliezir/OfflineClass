import { avatarSvg } from '@offlineclass/avatar'
import type { AvatarConfig } from '@offlineclass/shared'
import { cn } from '@renderer/shared/utils'
import { initials } from '../student-status'

const TONES = [
  'bg-primary-soft text-primary-soft-foreground',
  'bg-secondary-soft text-secondary-soft-foreground',
  'bg-tertiary-soft text-tertiary-soft-foreground'
]

/**
 * Student avatar. Renders the student's built avatar when present; otherwise
 * falls back to an initials bubble (tone derived from the name, stable per
 * student). The art fills whatever size `className` sets (defaults to size-9).
 */
export function StudentAvatar({
  name,
  avatar,
  className
}: {
  name: string
  avatar?: AvatarConfig | null
  className?: string
}): React.JSX.Element {
  if (avatar) {
    return (
      <span
        aria-hidden
        className={cn('block size-9 shrink-0 overflow-hidden rounded-full', className)}
        style={{ background: `#${avatar.backgroundColor || 'a5b4fc'}` }}
        dangerouslySetInnerHTML={{ __html: avatarSvg(avatar, { background: false }) }}
      />
    )
  }
  const tone = TONES[name.charCodeAt(0) % TONES.length]
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-full text-xs font-bold',
        tone,
        className
      )}
    >
      {initials(name)}
    </span>
  )
}
