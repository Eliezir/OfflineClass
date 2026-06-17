import { Check } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import type { StudentLiveStatus } from '../types'

/** Inline status chip for a student: entregue / ativo / ocioso. */
export function StudentStatusBadge({ status }: { status: StudentLiveStatus }): React.JSX.Element {
  if (status === 'submitted') {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-success">
        <Check className="size-3.5" />
        <Trans>entregue</Trans>
      </span>
    )
  }
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
        <Trans>ativo</Trans>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
      <span aria-hidden className="size-1.5 rounded-full bg-current" />
      <Trans>ocioso</Trans>
    </span>
  )
}
