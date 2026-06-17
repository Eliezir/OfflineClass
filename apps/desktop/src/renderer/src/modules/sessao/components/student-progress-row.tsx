import { Check } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import { deriveStudentStatus } from '../student-status'
import type { SessionLobbyStudent } from '../types'
import { StudentAvatar } from './student-avatar'

type StudentProgressRowProps = {
  student: SessionLobbyStudent
  questionsCount: number
  now: number
}

/** One student in the live dashboard: progress bar + last activity + status. */
export function StudentProgressRow({
  student,
  questionsCount,
  now
}: StudentProgressRowProps): React.JSX.Element {
  const { t } = useLingui()
  const status = deriveStudentStatus(student, now)
  const pct = questionsCount > 0 ? Math.round((student.answeredCount / questionsCount) * 100) : 0

  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-3 last:border-0">
      <StudentAvatar name={student.name} />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{student.name}</div>
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

      <div className="w-24 shrink-0 text-right">
        {status === 'submitted' ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
            <Check className="size-3.5" />
            {t`entregue`}
          </span>
        ) : status === 'active' ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {t`ativo`}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {t`ocioso`}
          </span>
        )}
      </div>
    </div>
  )
}
