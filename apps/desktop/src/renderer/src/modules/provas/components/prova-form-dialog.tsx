import { useEffect, useState } from 'react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/shared/ui/dialog'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { provaFormSchema, type ExamSummary } from '../schemas'
import { useCreateExam, useUpdateExam } from '../queries'

type ProvaFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** When set, edits this prova instead of creating one. */
  prova?: ExamSummary | null
}

export function ProvaFormDialog({
  open,
  onOpenChange,
  prova
}: ProvaFormDialogProps): React.JSX.Element {
  const { t } = useLingui()
  const editing = Boolean(prova)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const create = useCreateExam()
  const update = useUpdateExam()
  const pending = create.isPending || update.isPending

  useEffect(() => {
    if (open) {
      setTitle(prova?.title ?? '')
      setDescription(prova?.description ?? '')
      setError(null)
    }
  }, [open, prova])

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const parsed = provaFormSchema.safeParse({ title, description })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t`Dados inválidos.`)
      return
    }
    const payload = { title: parsed.data.title, description: parsed.data.description || null }
    try {
      if (prova) await update.mutateAsync({ id: prova.id, patch: payload })
      else await create.mutateAsync(payload)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : t`Não foi possível salvar a prova.`)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editing ? <Trans>Editar prova</Trans> : <Trans>Nova prova</Trans>}</DialogTitle>
            <DialogDescription>
              <Trans>Dê um título e uma descrição. As questões você adiciona depois.</Trans>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="prova-title">
                <Trans>Título</Trans>
              </Label>
              <Input
                id="prova-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t`Ex: Prova de Redes — Camada de Transporte`}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prova-desc">
                <Trans>Descrição</Trans>
              </Label>
              <Input
                id="prova-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t`Opcional`}
              />
            </div>
            {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              <Trans>Cancelar</Trans>
            </Button>
            <Button type="submit" disabled={pending}>
              {editing ? <Trans>Salvar</Trans> : <Trans>Criar prova</Trans>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
