import { Avatar } from '@offlineclass/avatar'
import type { AvatarConfig } from '@offlineclass/shared'

/** Initials fallback when the teacher hasn't set a profile avatar. */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Shows whose room the student joined: the teacher's avatar (or initials) and
 * name. Rendered on the join card and in the waiting room.
 */
export function TeacherChip({
  name,
  avatar,
  size = 28
}: {
  name: string
  avatar: AvatarConfig | null
  size?: number
}): React.JSX.Element {
  return (
    <div className="bg-muted/60 inline-flex w-fit max-w-full items-center gap-2 rounded-full py-1 pr-3 pl-1">
      {avatar ? (
        <Avatar config={avatar} size={size} />
      ) : (
        <span
          className="bg-primary text-primary-foreground grid shrink-0 place-items-center rounded-full text-xs font-bold"
          style={{ width: size, height: size }}
        >
          {initials(name)}
        </span>
      )}
      <span className="truncate text-sm font-semibold">
        <span className="text-muted-foreground font-medium">Professor(a): </span>
        {name}
      </span>
    </div>
  )
}
