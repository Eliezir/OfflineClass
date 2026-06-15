import { useState } from 'react'
import { Database, Sparkles } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'
import { Button } from '@renderer/shared/ui/button'
import { useDelayedLoading } from '@renderer/shared/hooks/use-delayed-loading'
import { allPresentations, allSlideModels, allVisualModels } from './mock-data'
import { PresentationsCard } from './components/presentations-card'
import { SlidesModelsCard } from './components/slides-models-card'
import { SummaryCard } from './components/summary-card'
import { VisualModelsCard } from './components/visual-models-card'

type DemoState = 'data' | 'empty' | 'loading'
const DEMO_LABEL: Record<DemoState, MessageDescriptor> = {
  data: msg`Com dados`,
  empty: msg`Vazio`,
  loading: msg`Carregando`
}
const NEXT_DEMO: Record<DemoState, DemoState> = { data: 'empty', empty: 'loading', loading: 'data' }

export function HomePage(): React.JSX.Element {
  const { t, i18n } = useLingui()
  const [demo, setDemo] = useState<DemoState>('data')
  const loading = useDelayedLoading(demo === 'loading')
  const presentations = demo === 'data' ? allPresentations : []
  const slideModels = demo === 'data' ? allSlideModels : []
  const visualModels = demo === 'data' ? allVisualModels : []

  return (
    <div className="@container flex h-full flex-1 flex-col">
      <main className="scrollbar-subtle flex h-full flex-1 flex-col overflow-y-auto px-6 py-6 tall:@2xl:overflow-hidden">
        <header className="mb-6 flex shrink-0 flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">
              <Trans>Início</Trans>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              <Trans>Tudo o que você cria com o apresenta.ai, num só lugar.</Trans>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDemo((d) => NEXT_DEMO[d])}
              title={t`Alternar estado de exemplo (dev)`}
            >
              <Database />
              {i18n._(DEMO_LABEL[demo])}
            </Button>
            <Button asChild>
              <Link to="/projects">
                <Sparkles />
                <Trans>Nova apresentação</Trans>
              </Link>
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 @2xl:grid-cols-12 tall:@2xl:min-h-0 tall:@2xl:flex-1">
          <div className="flex flex-col gap-5 @2xl:col-span-4 tall:@2xl:min-h-0">
            <SlidesModelsCard
              items={slideModels}
              loading={loading}
              className="min-h-[260px] tall:@2xl:min-h-0 tall:@2xl:flex-1"
            />
            <SummaryCard
              presentations={presentations.length}
              slideModels={slideModels.length}
              visualModels={visualModels.length}
              loading={loading}
            />
          </div>
          <div className="flex flex-col gap-5 @2xl:col-span-8 tall:@2xl:min-h-0">
            <PresentationsCard
              items={presentations}
              loading={loading}
              className="min-h-[260px] tall:@2xl:min-h-0 tall:@2xl:flex-1"
            />
            <VisualModelsCard items={visualModels} loading={loading} />
          </div>
        </div>
      </main>
    </div>
  )
}
