import { useEffect, useState } from 'react'
import { Timer } from 'lucide-react'
import { cn } from '@renderer/shared/utils'
import { formatCountdown } from '../format-time'

type CountdownProps = {
  /** When the session started (ms epoch). */
  startedAt: number
  durationMinutes: number
}

/** Live ticking countdown pill. Turns amber under 5 minutes, red at zero. */
export function Countdown({ startedAt, durationMinutes }: CountdownProps): React.JSX.Element {
  const endsAt = startedAt + durationMinutes * 60_000
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const remaining = endsAt - now
  const isOver = remaining <= 0
  const isLow = !isOver && remaining < 5 * 60_000

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs font-bold tabular-nums',
        isOver
          ? 'bg-destructive text-destructive-foreground'
          : isLow
            ? 'bg-warning text-warning-foreground'
            : 'bg-muted text-foreground'
      )}
    >
      <Timer className="size-3.5" />
      {formatCountdown(remaining)}
    </span>
  )
}
