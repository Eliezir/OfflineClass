import { useLingui } from '@lingui/react/macro'
import type { SessionResultSummary } from '@offlineclass/shared'

type ResultRowProps = {
  result: SessionResultSummary
}

export function ResultRow({ result }: ResultRowProps): React.JSX.Element {
  const { t } = useLingui()
  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-bold">{result.examTitle}</div>
        <div className="text-xs font-semibold text-muted-foreground">
          {result.studentCount} {t`alunos`}
        </div>
      </div>
      <span className="ml-auto rounded-full bg-secondary-soft px-2.5 py-1 text-xs font-bold text-secondary-soft-foreground">
        {result.averageScore.toFixed(1)}
      </span>
    </div>
  )
}
