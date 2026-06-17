import { useState } from 'react'
import { ClipboardList, Plus, Trash2 } from 'lucide-react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { PageHeader } from '@renderer/shared/components/page-header'
import { formatRelativeTime } from '@renderer/shared/utils/format'
import { useDeleteExam, useExamsQuery } from '../queries'
import type { ExamSummary } from '../schemas'
import { ProvaFormDialog } from './prova-form-dialog'

export function ProvasPage(): React.JSX.Element {
  const { t } = useLingui()
  const { data: provas, isLoading } = useExamsQuery()
  const del = useDeleteExam()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExamSummary | null>(null)

  const navigate = useNavigate()
  // `?new=true` (deep link from the command palette) opens the create dialog;
  // it's the single source of truth for that open state until dismissed.
  const wantsNew = useSearch({ from: '/_app/provas', select: (s) => s.new })

  const openCreate = (): void => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (prova: ExamSummary): void => {
    setEditing(prova)
    setDialogOpen(true)
  }

  const formOpen = dialogOpen || Boolean(wantsNew)

  const onFormOpenChange = (next: boolean): void => {
    if (!next) setEditing(null)
    setDialogOpen(next)
    // Drop the deep-link param so the dialog doesn't reopen on the next render.
    if (!next && wantsNew) void navigate({ to: '/provas', search: {}, replace: true })
  }

  return (
    <main className="scrollbar-subtle flex flex-1 flex-col overflow-y-auto px-6 pb-6">
      <PageHeader
        title={<Trans>Provas</Trans>}
        subtitle={<Trans>Crie e organize suas avaliações.</Trans>}
        actions={
          <Button onClick={openCreate}>
            <Plus />
            <Trans>Nova prova</Trans>
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : !provas || provas.length === 0 ? (
        <EmptyState
          icon={<ClipboardList />}
          title={t`Nenhuma prova ainda`}
          description={<Trans>Crie sua primeira prova para começar a aplicar avaliações.</Trans>}
          action={
            <Button onClick={openCreate}>
              <Plus />
              <Trans>Nova prova</Trans>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {provas.map((p) => (
            <div
              key={p.id}
              className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary [&_svg]:size-5">
                  <ClipboardList />
                </span>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={t`Excluir prova`}
                  title={t`Excluir prova`}
                  onClick={() => del.mutate(p.id)}
                >
                  <Trash2 />
                </Button>
              </div>
              <button type="button" className="flex-1 text-left" onClick={() => openEdit(p)}>
                <div className="line-clamp-2 font-bold leading-snug">{p.title}</div>
                <div className="mt-1 text-xs font-semibold text-muted-foreground">
                  {p.questionsCount} {t`questões`} · {formatRelativeTime(p.updatedAt)}
                </div>
              </button>
            </div>
          ))}
        </div>
      )}

      <ProvaFormDialog
        open={formOpen}
        onOpenChange={onFormOpenChange}
        prova={wantsNew ? null : editing}
      />
    </main>
  )
}
