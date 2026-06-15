import { Bookmark, LayoutTemplate, Repeat2, Sparkles, Upload } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { EmptyStateSteps } from '@renderer/shared/ui/empty-state-steps'
import emptySlidesModels from '@renderer/shared/assets/empty-slides-models.svg'

export const Route = createFileRoute('/_app/slides-models')({
  component: SlidesModelsPage
})

function SlidesModelsPage(): React.JSX.Element {
  const { t } = useLingui()
  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <Trans>Modelos de Slides</Trans>
        </h1>
      </header>

      <EmptyState
        glow
        illustration={
          <img
            src={emptySlidesModels}
            alt=""
            aria-hidden
            draggable={false}
            className="h-full w-full animate-in select-none object-contain fade-in-0 duration-500"
          />
        }
        eyebrow={<Trans>Reutilize seus slides</Trans>}
        title={t`Salve seu primeiro modelo de slides`}
        description={
          <Trans>
            Importe um modelo ou salve a estrutura de uma apresentação que você já gerou.
          </Trans>
        }
        action={
          <>
            <Button>
              <LayoutTemplate />
              <Trans>Escolher de uma apresentação</Trans>
            </Button>
            <Button variant="secondary">
              <Upload />
              <Trans>Importar</Trans>
            </Button>
          </>
        }
        footer={
          <EmptyStateSteps
            steps={[
              { icon: <Sparkles />, label: <Trans>Importe ou gere slides</Trans> },
              { icon: <Bookmark />, label: <Trans>Salve como modelo</Trans> },
              { icon: <Repeat2 />, label: <Trans>Reaproveite</Trans> }
            ]}
          />
        }
      />
    </main>
  )
}
