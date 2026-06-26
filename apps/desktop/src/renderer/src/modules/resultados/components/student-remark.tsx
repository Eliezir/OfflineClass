import { useState } from 'react'
import { NotebookPen } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Textarea } from '@renderer/shared/ui/textarea'

type StudentRemarkProps = {
  /** Current saved remark; null when none. Re-seeds local state when it changes. */
  feedback: string | null
  onSave: (comment: string) => void
}

/** Overall remark on a student's exam. Saved on blur when it changed; included
    in the grade e-mail the teacher sends afterwards. */
export function StudentRemark({ feedback, onSave }: StudentRemarkProps): React.JSX.Element {
  const { t } = useLingui()
  const [draft, setDraft] = useState(feedback ?? '')

  return (
    <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <NotebookPen className="size-3.5" />
        <Trans>Observações gerais</Trans>
      </span>
      <Textarea
        value={draft}
        placeholder={t`Comentário geral sobre o desempenho do aluno (enviado no e-mail)…`}
        aria-label={t`Observações gerais`}
        className="min-h-16 text-sm"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== (feedback ?? '')) onSave(draft)
        }}
      />
    </div>
  )
}
