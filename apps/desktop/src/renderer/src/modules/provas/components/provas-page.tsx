import { useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { PageHeader } from '@renderer/shared/components/page-header'
import { useDeleteExam, useDuplicateExam, useExamsQuery } from '../queries'
import type { ExamSummary } from '../schemas'
import { ProvaCard } from './prova-card'
import { ProvaFormDialog } from './prova-form-dialog'

export function ProvasPage(): React.JSX.Element {
  const { t } = useLingui()
  const { data: provas, isLoading } = useExamsQuery()
  const del = useDeleteExam()
  const duplicate = useDuplicateExam()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ExamSummary | null>(null)

  const openCreate = (): void => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (prova: ExamSummary): void => {
    setEditing(prova)
    setDialogOpen(true)
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
            <ProvaCard
              key={p.id}
              prova={p}
              onEdit={() => openEdit(p)}
              onDuplicate={() => duplicate.mutate(p.id)}
              onDelete={() => del.mutate(p.id)}
            />
          ))}
        </div>
      )}

      <ProvaFormDialog open={dialogOpen} onOpenChange={setDialogOpen} prova={editing} />
    </main>
  )
}
