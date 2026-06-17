import { ChevronRight, Users } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import type { EndedSession } from '../types'

type EndedSessionCardProps = {
  session: EndedSession
  onOpen: () => void
}

export function EndedSessionCard({ session, onOpen }: EndedSessionCardProps): React.JSX.Element {
  const { t } = useLingui()
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary [&_svg]:size-5">
        <Users />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{session.examTitle}</div>
        <div className="mt-0.5 text-xs font-semibold text-muted-foreground">
          {session.endedAt ? (
            <>
              {t`encerrada`} {formatRelativeTime(session.endedAt)} ·{' '}
            </>
          ) : null}
          {session.submittedCount}/{session.studentsCount} {t`entregues`}
        </div>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
    </button>
  )
}
