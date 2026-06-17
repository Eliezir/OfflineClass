import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
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
import { EmojiPicker } from '@renderer/shared/ui/emoji-picker'
import { Input } from '@renderer/shared/ui/input'
import { Label } from '@renderer/shared/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/shared/ui/popover'
import { Textarea } from '@renderer/shared/ui/textarea'
import { provaFormSchema, type ExamSummary } from '../schemas'
import { useCreateExam, useUpdateExam } from '../queries'

const DEFAULT_ICON = '📋'

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Keyed so each open (and each different prova) mounts fresh state — no reset effect. */}
        <ProvaForm key={prova?.id ?? 'new'} prova={prova} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  )
}

function ProvaForm({
  prova,
  onOpenChange
}: {
  prova?: ExamSummary | null
  onOpenChange: (open: boolean) => void
}): React.JSX.Element {
  const { t } = useLingui()
  const navigate = useNavigate()
  const editing = Boolean(prova)
  const [title, setTitle] = useState(prova?.title ?? '')
  const [description, setDescription] = useState(prova?.description ?? '')
  const [subject, setSubject] = useState(prova?.subject ?? '')
  const [gradeLevel, setGradeLevel] = useState(prova?.gradeLevel ?? '')
  const [icon, setIcon] = useState(prova?.icon ?? '')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const create = useCreateExam()
  const update = useUpdateExam()
  const pending = create.isPending || update.isPending

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault()
    const parsed = provaFormSchema.safeParse({ title, description, subject, gradeLevel, icon })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? t`Dados inválidos.`)
      return
    }
    const d = parsed.data
    const payload = {
      title: d.title,
      description: d.description || null,
      subject: d.subject || null,
      gradeLevel: d.gradeLevel || null,
      icon: d.icon || null
    }
    try {
      if (prova) {
        await update.mutateAsync({ id: prova.id, patch: payload })
        onOpenChange(false)
      } else {
        // Fresh prova → jump straight into the builder to add questions.
        const created = await create.mutateAsync(payload)
        onOpenChange(false)
        await navigate({ to: '/provas/$examId', params: { examId: created.id } })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t`Não foi possível salvar a prova.`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>
          {editing ? <Trans>Editar prova</Trans> : <Trans>Nova prova</Trans>}
        </DialogTitle>
        <DialogDescription>
          <Trans>Dê um ícone, um título e uma descrição. As questões você adiciona depois.</Trans>
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="flex items-end gap-3">
          <div className="space-y-1.5">
            <Label>
              <Trans>Ícone</Trans>
            </Label>
            <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label={t`Escolher ícone`}
                  className="grid size-10 shrink-0 place-items-center rounded-[14px] border border-input-border bg-input text-2xl shadow-[var(--edge-soft)] outline-none transition-colors hover:border-ring focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25"
                >
                  {icon || DEFAULT_ICON}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start">
                <EmojiPicker
                  value={icon}
                  onSelect={(emoji) => {
                    setIcon(emoji)
                    setEmojiOpen(false)
                  }}
                />
                {icon && (
                  <div className="border-t border-border p-1.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setIcon('')
                        setEmojiOpen(false)
                      }}
                    >
                      <Trans>Remover ícone</Trans>
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-1 space-y-1.5">
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
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="prova-subject">
              <Trans>Disciplina</Trans>
            </Label>
            <Input
              id="prova-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t`Ex: Redes de Computadores`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prova-grade">
              <Trans>Série / período</Trans>
            </Label>
            <Input
              id="prova-grade"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              placeholder={t`Ex: 3º semestre`}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="prova-desc">
            <Trans>Descrição</Trans>
          </Label>
          <Textarea
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
  )
}
