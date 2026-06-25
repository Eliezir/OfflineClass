import { useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import { deriveStudentStatus } from '../student-status'
import type { SessionLobbyStudent } from '../types'
import { StudentAvatar } from './student-avatar'
import { StudentStatusBadge } from './student-status-badge'

type StudentProgressRowProps = {
  student: SessionLobbyStudent
  groupName?: string
  questionsCount: number
  now: number
  onSelect: () => void
}

/** One student in the live dashboard: progress bar + last activity + status.
    Clicking opens the single-student drill-down. */
export function StudentProgressRow({
  student,
  groupName,
  questionsCount,
  now,
  onSelect
}: StudentProgressRowProps): React.JSX.Element {
  const { t } = useLingui()
  const status = deriveStudentStatus(student, now)
  const pct = questionsCount > 0 ? Math.round((student.answeredCount / questionsCount) * 100) : 0

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 border-b border-border/60 py-3 text-left transition-colors last:border-0 hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
    >
      <StudentAvatar name={student.name} avatar={student.avatar} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold flex items-center gap-1.5">
          <span>{student.name}</span>
          {groupName && (
            <span className="inline-flex shrink-0 items-center rounded bg-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-primary-soft-foreground uppercase tracking-wider">
              {groupName}
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-muted-foreground">{student.matricula}</div>
      </div>

      <div className="hidden w-40 shrink-0 sm:block">
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-500',
              status === 'submitted' ? 'bg-success' : 'bg-primary'
            )}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1 text-[11px] font-bold text-muted-foreground">
          {student.answeredCount}/{questionsCount} {t`questões`}
        </div>
      </div>

      <div className="hidden w-24 shrink-0 text-right text-xs font-semibold text-muted-foreground md:block">
        {status === 'submitted' ? '—' : formatRelativeTime(student.lastSeenAt)}
      </div>

      <div className="flex w-24 shrink-0 justify-end">
        <StudentStatusBadge status={status} />
      </div>
    </button>
  )
}
