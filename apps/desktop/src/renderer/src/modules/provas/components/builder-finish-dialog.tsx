import { AlertTriangle, Check, ClipboardList, Radio } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/shared/ui/dialog'

type BuilderFinishDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  icon: string | null
  questionsCount: number
  totalPoints: number
  warnings: string[]
  onFinish: () => void
  onStartSession: () => void
}

export function BuilderFinishDialog({
  open,
  onOpenChange,
  title,
  icon,
  questionsCount,
  totalPoints,
  warnings,
  onFinish,
  onStartSession
}: BuilderFinishDialogProps): React.JSX.Element {
  const empty = questionsCount === 0
  const points = Math.round(totalPoints * 100) / 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            <Trans>Iniciar sessão</Trans>
          </DialogTitle>
          <DialogDescription>
            <Trans>
              Revise a prova e abra a sala para os alunos. Suas alterações já foram salvas
              automaticamente.
            </Trans>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/40 p-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-xl text-primary [&_svg]:size-5">
              {icon ? icon : <ClipboardList />}
            </span>
            <div className="min-w-0">
              <div className="truncate font-bold leading-snug">{title}</div>
              <div className="text-xs font-semibold text-muted-foreground">
                {questionsCount} <Trans>questões</Trans> · {points}{' '}
                {points === 1 ? <Trans>ponto</Trans> : <Trans>pontos</Trans>}
              </div>
            </div>
          </div>

          {warnings.length > 0 && (
            <ul className="space-y-1.5">
              {warnings.map((w) => (
                <li
                  key={w}
                  className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-xs font-semibold text-warning-foreground"
                >
                  <AlertTriangle className="mt-px size-3.5 shrink-0 text-warning" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            <Trans>Continuar editando</Trans>
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onFinish}>
              <Check />
              <Trans>Concluir</Trans>
            </Button>
            <Button disabled={empty} onClick={onStartSession}>
              <Radio />
              <Trans>Iniciar sessão</Trans>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
