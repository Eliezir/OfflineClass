import { Trans, useLingui } from '@lingui/react/macro'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import type { SessionLobbyStudent } from '../types'
import { StudentAvatar } from './student-avatar'

type RosterRowProps = {
  student: SessionLobbyStudent
}

/** One student in the lobby roster: avatar, identity, "entrou há…", live dot. */
export function RosterRow({ student }: RosterRowProps): React.JSX.Element {
  const { t } = useLingui()
  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0">
      <StudentAvatar name={student.name} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{student.name}</div>
        <div className="text-xs font-semibold text-muted-foreground">
          {student.matricula} · <Trans>entrou {formatRelativeTime(student.joinedAt)}</Trans>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-success">
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        {t`na sala`}
      </span>
    </div>
  )
}
