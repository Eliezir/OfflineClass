import * as React from 'react'
import Lottie from 'lottie-react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { Trans } from '@lingui/react/macro'

import { cn } from '@renderer/shared/utils'
import { Button } from '@renderer/shared/ui/button'
import deleteAnimation from '@renderer/assets/lottie/delete.json'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@renderer/shared/ui/dialog'

/** Tipos de entidade que podem ser excluídas com confirmação. */
export type DeleteEntity = 'project' | 'theme' | 'slide'

/** Recurso associado que será perdido (chip no cartão de pré-visualização). */
export type DeletePreviewAsset = { label: string; count?: number }

/**
 * Pré-visualização do alvo da exclusão — dá ao usuário a confiança de que está
 * apagando a coisa certa. Quando ausente, o diálogo cai para o layout simples.
 */
export type DeletePreview = {
  /** URL/import de imagem de capa ou miniatura. */
  image?: string
  /** Cor ou gradiente CSS de fundo do quadro (capa de modelo, fallback de slide). */
  background?: string
  /** Cor do conteúdo sobre o `background` (quando não há imagem). */
  foreground?: string
  /** Título exibido no cartão. Cai para `name` quando ausente. */
  title?: string
  /** Linha de metadados, ex.: "8 slides · editado há 2 dias". */
  meta?: string
  /** Recursos associados que serão perdidos. */
  assets?: DeletePreviewAsset[]
}

type ConfirmDeleteDialogProps = {
  /** Controla a visibilidade (modal controlado pelo chamador). */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Define a cópia e o ícone exibidos. */
  entity: DeleteEntity
  /**
   * Nome da apresentação/modelo visual, ou o rótulo de posição do slide
   * (ex.: "3"). Renderizado em destaque no corpo do diálogo.
   */
  name?: string
  /** Cartão opcional que mostra o alvo da exclusão (imagem, capa, recursos). */
  preview?: DeletePreview
  /** Disparado ao confirmar. O chamador é dono da mutação. */
  onConfirm: () => void
  /** Mantém o botão de exclusão em estado de carregamento. */
  isPending?: boolean
}

type DeleteCopy = {
  title: React.ReactNode
  description: React.ReactNode
}

function Highlight({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <span className="font-medium text-foreground">{children}</span>
}

function copyFor(entity: DeleteEntity, name?: string): DeleteCopy {
  const label = name ?? ''

  switch (entity) {
    case 'project':
      return {
        title: <Trans>Excluir esta apresentação?</Trans>,
        description: (
          <Trans>
            A apresentação <Highlight>“{label}”</Highlight> será removida permanentemente. Slides e
            histórico associados serão perdidos.
          </Trans>
        )
      }
    case 'theme':
      return {
        title: <Trans>Excluir este modelo visual?</Trans>,
        description: (
          <Trans>
            O modelo <Highlight>“{label}”</Highlight> será excluído da sua biblioteca. Apresentações
            que já o utilizam mantêm o visual atual.
          </Trans>
        )
      }
    case 'slide':
      return {
        title: <Trans>Excluir este slide?</Trans>,
        description: (
          <Trans>
            O slide <Highlight>{label}</Highlight> será removido da apresentação.
          </Trans>
        )
      }
  }
}

function PreviewCard({
  preview,
  fallbackTitle
}: {
  preview: DeletePreview
  fallbackTitle?: string
}): React.JSX.Element {
  const title = preview.title ?? fallbackTitle ?? ''

  return (
    <div className="flex gap-3 rounded-xl border border-border bg-card p-3">
      <div
        className={cn(
          'grid size-16 shrink-0 place-items-center overflow-hidden rounded-lg',
          !preview.image && 'bg-muted text-muted-foreground'
        )}
        style={
          !preview.image && preview.background
            ? { background: preview.background, color: preview.foreground }
            : undefined
        }
      >
        {preview.image ? (
          <img src={preview.image} alt="" className="size-full object-cover" />
        ) : (
          <ImageIcon className="size-5 opacity-80" />
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-1.5">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        {preview.meta && <p className="truncate text-xs text-muted-foreground">{preview.meta}</p>}
        {preview.assets && preview.assets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {preview.assets.map((asset) => (
              <span
                key={asset.label}
                className="inline-flex items-center gap-1 rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {typeof asset.count === 'number' && (
                  <span className="text-foreground">{asset.count}</span>
                )}
                {asset.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  entity,
  name,
  preview,
  onConfirm,
  isPending = false
}: ConfirmDeleteDialogProps): React.JSX.Element {
  const { title, description } = copyFor(entity, name)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-0 overflow-hidden p-0 sm:max-w-md">
        {/* Animação com halo suave de destaque. */}
        <div className="relative flex justify-center px-7 pt-9">
          <span
            aria-hidden
            className="absolute top-1/2 left-1/2 size-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-destructive/10 blur-2xl"
          />
          <Lottie animationData={deleteAnimation} loop={false} className="relative size-28" aria-hidden />
        </div>

        <DialogHeader className="items-center px-7 pt-4 text-center sm:text-center">
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription className="mx-auto mt-2 max-w-[22rem] text-sm leading-relaxed text-balance">
            {description}
          </DialogDescription>
        </DialogHeader>

        {preview && (
          <div className="px-7 pt-5">
            <PreviewCard preview={preview} fallbackTitle={name} />
          </div>
        )}

        <DialogFooter className="grid grid-cols-2 gap-3 px-7 pt-7 pb-7">
          <DialogClose asChild>
            <Button
              variant="outline"
              size="lg"
              disabled={isPending}
              className="w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive"
            >
              <Trans>Cancelar</Trans>
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            size="lg"
            onClick={onConfirm}
            disabled={isPending}
            className="w-full rounded-xl"
          >
            {isPending && <Loader2 className="animate-spin" />}
            <Trans>Excluir</Trans>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
