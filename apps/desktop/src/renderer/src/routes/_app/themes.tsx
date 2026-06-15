import { ImagePlus, Palette, Plus, Type } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { EmptyStateSteps } from '@renderer/shared/ui/empty-state-steps'
import blankCanvas from '@renderer/shared/assets/blank-canvas.svg'

export const Route = createFileRoute('/_app/themes')({
  component: ThemesPage
})

function ThemesPage(): React.JSX.Element {
  const { t } = useLingui()
  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <Trans>Temas</Trans>
        </h1>
      </header>

      <EmptyState
        glow
        illustration={
          <img
            src={blankCanvas}
            alt=""
            aria-hidden
            draggable={false}
            className="h-full w-full animate-in select-none object-contain fade-in-0 duration-500"
          />
        }
        eyebrow={<Trans>Identidade visual</Trans>}
        title={t`Crie seu primeiro tema`}
        description={
          <Trans>
            Reúna cores, fontes e assets — a IA aplica o estilo em todas as apresentações.
          </Trans>
        }
        action={
          <>
            <Button>
              <Plus />
              <Trans>Novo tema</Trans>
            </Button>
            <Button variant="secondary">
              <Trans>Ver predefinições</Trans>
            </Button>
          </>
        }
        footer={
          <EmptyStateSteps
            steps={[
              { icon: <Palette />, label: <Trans>Defina as cores</Trans> },
              { icon: <Type />, label: <Trans>Escolha as fontes</Trans> },
              { icon: <ImagePlus />, label: <Trans>Adicione assets</Trans> }
            ]}
          />
        }
      />
    </main>
  )
}
