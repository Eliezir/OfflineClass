import { useState } from 'react'
import { ChartColumn, ClipboardList, Database, FileText, Plus, Radio, Users } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import type { MessageDescriptor } from '@lingui/core'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { PageHeader } from '@renderer/shared/components/page-header'
import { useDelayedLoading } from '@renderer/shared/hooks/use-delayed-loading'
import { useActiveSessionQuery } from '../sessao/queries'
import { homeStats, recentProvas, recentResults } from './mock-data'
import { LiveSessionBanner } from './components/live-session-banner'
import { ProvaCard } from './components/prova-card'
import { ResultRow } from './components/result-row'
import { SectionPanel } from './components/section-panel'
import { StatCard } from './components/stat-card'
import { ProvaCardSkeleton, ResultRowSkeleton, StatCardSkeleton } from './components/home-skeletons'

type DemoState = 'data' | 'empty' | 'loading'
const DEMO_LABEL: Record<DemoState, MessageDescriptor> = {
  data: msg`Com dados mockados`,
  empty: msg`Dados reais (Vazio)`,
  loading: msg`Carregando`
}
const NEXT_DEMO: Record<DemoState, DemoState> = { data: 'empty', empty: 'loading', loading: 'data' }

const EMPTY_STATS = { provas: 0, sessions: 0, studentsGraded: 0 }

function SeeAll({ to }: { to: '/provas' | '/resultados' }): React.JSX.Element {
  return (
    <Button asChild variant="link" size="xs" className="text-primary">
      <Link to={to}>
        <Trans>Ver todas</Trans>
      </Link>
    </Button>
  )
}

export function HomePage(): React.JSX.Element {
  const { t, i18n } = useLingui()
  const [demo, setDemo] = useState<DemoState>('data')
  const loading = useDelayedLoading(demo === 'loading')

  // BUSCA REAL: Consulta o Electron/SQLite em tempo real
  const { data: activeSession, isLoading: isSessionLoading } = useActiveSessionQuery()

  const isData = demo === 'data'
  const stats = demo === 'empty' ? EMPTY_STATS : homeStats
  const provas = isData ? recentProvas : []
  const results = isData ? recentResults : []

  // MAPEAMENTO REAL: Traduz a estrutura da tabela SessionDetail para a assinatura do Banner
  const live = activeSession
    ? {
        provaTitle: activeSession.examTitle,
        groups: 1,
        students: activeSession.students?.length ?? 0,
        minutesLeft: activeSession.durationMinutes
      }
    : null

  return (
    <main className="scrollbar-subtle flex flex-1 flex-col overflow-y-auto px-6 pb-6 tall:overflow-hidden">
      <PageHeader
        title={<Trans>Início</Trans>}
        subtitle={<Trans>Bem-vindo de volta. Pronto para aplicar uma avaliação?</Trans>}
        actions={
          <>
            {import.meta.env.DEV && (
              <Button variant="outline" onClick={() => setDemo((d) => NEXT_DEMO[d])}>
                <Database />
                {i18n._(DEMO_LABEL[demo])}
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to="/sessao">
                <Radio />
                <Trans>Iniciar sessão</Trans>
              </Link>
            </Button>
            <Button asChild>
              <Link to="/provas">
                <Plus />
                <Trans>Nova prova</Trans>
              </Link>
            </Button>
          </>
        }
      />

      {/* RENDERIZAÇÃO ISOLADA: Mostra a barra se houver sessão ativa real, ignorando o botão demo */}
      {isSessionLoading ? (
        <div className="mb-5 h-20 animate-pulse rounded-2xl bg-muted/40" />
      ) : activeSession && live ? (
        <LiveSessionBanner session={live} />
      ) : null}

      <div className="mb-5 grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        {loading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              tone="primary"
              icon={<ClipboardList />}
              value={stats.provas}
              label={<Trans>Provas</Trans>}
              hint={isData ? <Trans>+3 esta semana</Trans> : undefined}
            />
            <StatCard
              tone="tertiary"
              icon={<FileText />}
              value={stats.sessions}
              label={<Trans>Sessões aplicadas</Trans>}
              hint={isData ? <Trans>5 este mês</Trans> : undefined}
            />
            <StatCard
              tone="secondary"
              icon={<Users />}
              value={stats.studentsGraded}
              label={<Trans>Alunos avaliados</Trans>}
              hint={isData ? <Trans>+18 esta semana</Trans> : undefined}
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 tall:min-h-0 tall:flex-1 lg:grid-cols-[1fr_340px]">
        <SectionPanel
          fill
          title={<Trans>Suas provas</Trans>}
          subtitle={<Trans>Recentes · toque ▶ para aplicar</Trans>}
          action={<SeeAll to="/provas" />}
        >
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProvaCardSkeleton key={i} />
              ))}
            </div>
          ) : provas.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {provas.map((p) => (
                <ProvaCard key={p.id} prova={p} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ClipboardList />}
              title={t`Nenhuma prova ainda`}
              description={
                <Trans>Crie sua primeira prova para começar a aplicar avaliações.</Trans>
              }
              action={
                <Button asChild>
                  <Link to="/provas">
                    <Plus />
                    <Trans>Nova prova</Trans>
                  </Link>
                </Button>
              }
            />
          )}
        </SectionPanel>

        <SectionPanel
          fill
          title={<Trans>Resultados recentes</Trans>}
          subtitle={<Trans>Últimas sessões encerradas</Trans>}
          action={<SeeAll to="/resultados" />}
        >
          {loading ? (
            <>
              {Array.from({ length: 4 }).map((_, i) => (
                <ResultRowSkeleton key={i} />
              ))}
            </>
          ) : results.length > 0 ? (
            results.map((r) => <ResultRow key={r.id} result={r} />)
          ) : (
            <EmptyState
              compact
              icon={<ChartColumn />}
              title={t`Sem resultados ainda`}
              description={
                <Trans>Os resultados aparecem aqui depois que você encerra uma sessão.</Trans>
              }
            />
          )}
        </SectionPanel>
      </div>
    </main>
  )
}
