import { useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import { StudentAvatar } from '@renderer/modules/sessao/components/student-avatar'
import type { StudentResult } from '../types'

type StudentResultItemProps = {
  student: StudentResult
  selected: boolean
  onSelect: () => void
}

export function StudentResultItem({
  student,
  selected,
  onSelect
}: StudentResultItemProps): React.JSX.Element {
  const { t } = useLingui()
  const pending = student.answers.some(
    (a) => a.question.kind === 'essay' && a.value !== null && a.awarded === null
  )

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-primary-soft' : 'hover:bg-muted/50'
      )}
    >
      <StudentAvatar name={student.name} avatar={student.avatar} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{student.name}</div>
        <div className="text-xs font-semibold text-muted-foreground">{student.matricula}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-bold tabular-nums">
          {student.total}
          <span className="text-muted-foreground">/{student.maxTotal}</span>
        </div>
        {pending && (
          <div className="text-[10px] font-bold text-tertiary-soft-foreground">{t`a corrigir`}</div>
        )}
      </div>
    </button>
  )
}
