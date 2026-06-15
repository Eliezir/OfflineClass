import { Palette, PencilLine, Sparkles } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { EmptyStateSteps } from '@renderer/shared/ui/empty-state-steps'
import emptyPresentations from '@renderer/shared/assets/empty-presentations.svg'

export const Route = createFileRoute('/_app/projects')({
  component: ProjectsPage
})

function ProjectsPage(): React.JSX.Element {
  const { t } = useLingui()
  return (
    <main className="flex flex-1 flex-col overflow-y-auto px-6 py-6">
      <header className="mb-6 flex items-baseline gap-3">
        <h1 className="font-display text-2xl font-bold tracking-tight">
          <Trans>Projetos</Trans>
        </h1>
      </header>

      <EmptyState
        glow
        illustration={
          <img
            src={emptyPresentations}
            alt=""
            aria-hidden
            draggable={false}
            className="h-full w-full animate-in select-none object-contain fade-in-0 duration-500"
          />
        }
        eyebrow={<Trans>Comece agora</Trans>}
        title={t`Crie sua primeira apresentação`}
        description={
          <Trans>
            Cole qualquer conteúdo — a IA estrutura em Markdown e gera uma apresentação interativa.
          </Trans>
        }
        action={
          <>
            <Button>
              <Sparkles />
              <Trans>Criar apresentação</Trans>
            </Button>
            <Button variant="secondary">
              <Trans>Ver exemplos</Trans>
            </Button>
          </>
        }
        footer={
          <EmptyStateSteps
            steps={[
              { icon: <PencilLine />, label: <Trans>Escreva ou cole</Trans> },
              { icon: <Palette />, label: <Trans>Escolha um tema</Trans> },
              { icon: <Sparkles />, label: <Trans>Gere em HTML</Trans> }
            ]}
          />
        }
      />
    </main>
  )
}
