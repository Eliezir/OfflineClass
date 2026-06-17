import { cn } from '@renderer/shared/utils'
import { initials } from '../student-status'

const TONES = [
  'bg-primary-soft text-primary-soft-foreground',
  'bg-secondary-soft text-secondary-soft-foreground',
  'bg-tertiary-soft text-tertiary-soft-foreground'
]

/** Initials bubble. Tone is derived from the name so it's stable per student. */
export function StudentAvatar({
  name,
  className
}: {
  name: string
  className?: string
}): React.JSX.Element {
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
