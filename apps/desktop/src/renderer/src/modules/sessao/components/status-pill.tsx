import { Trans } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import type { SessionStatus } from '../types'

const STYLES: Record<SessionStatus, string> = {
  lobby: 'bg-tertiary-soft text-tertiary-soft-foreground',
  running: 'bg-primary text-primary-foreground',
  ended: 'bg-muted text-muted-foreground'
}

/** Small lifecycle badge. The `running` variant pulses a live dot. */
export function StatusPill({ status }: { status: SessionStatus }): React.JSX.Element {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold',
        STYLES[status]
      )}
    >
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full bg-current', status === 'running' && 'animate-pulse')}
      />
      {status === 'lobby' && <Trans>Lobby</Trans>}
      {status === 'running' && <Trans>Ao vivo</Trans>}
      {status === 'ended' && <Trans>Encerrada</Trans>}
    </span>
  )
}
