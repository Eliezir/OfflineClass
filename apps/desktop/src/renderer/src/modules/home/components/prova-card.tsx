import { ClipboardList, Play } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import type { ExamSummary } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { formatRelativeTime } from '@renderer/shared/utils/format'

type ProvaCardProps = {
  prova: ExamSummary
}

export function ProvaCard({ prova }: ProvaCardProps): React.JSX.Element {
  const { t } = useLingui()
  return (
    <div className="flex h-full flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/40">
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary [&_svg]:size-[18px]">
          <ClipboardList />
        </span>
        <Button size="icon-sm" aria-label={t`Iniciar sessão`} title={t`Iniciar sessão`}>
          <Play />
        </Button>
      </div>
      <div className="min-w-0">
        <div className="line-clamp-2 text-sm font-bold leading-snug">{prova.title}</div>
        <div className="mt-1 text-xs font-semibold text-muted-foreground">
          {prova.questionsCount} {t`questões`} · {formatRelativeTime(prova.updatedAt)}
        </div>
      </div>
    </div>
  )
}
