import { NotebookPen } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { CommentField } from './comment-field'

type StudentRemarkProps = {
  /** Current saved remark; null when none. Re-seeds local state when it changes. */
  feedback: string | null
  onSave: (comment: string) => void | Promise<unknown>
}

/** Overall remark on a student's exam. Saved on blur when it changed; included
    in the grade e-mail the teacher sends afterwards. */
export function StudentRemark({ feedback, onSave }: StudentRemarkProps): React.JSX.Element {
  const { t } = useLingui()

  return (
    <div className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
        <NotebookPen className="size-3.5" />
        <Trans>Observações gerais</Trans>
      </span>
      <CommentField
        value={feedback}
        onSave={onSave}
        placeholder={t`Comentário geral sobre o desempenho do aluno…`}
        ariaLabel={t`Observações gerais`}
      />
    </div>
  )
}
