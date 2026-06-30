import { ChartColumn, ClipboardList, FileText, Plus, Radio, Users } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { PageHeader } from '@renderer/shared/components/page-header'
import { useDelayedLoading } from '@renderer/shared/hooks/use-delayed-loading'
import { useExamsQuery } from '../provas/queries'
import { useActiveSessionQuery, useRecentResultsQuery, useSessionsQuery } from '../sessao/queries'
import { LiveSessionBanner } from './components/live-session-banner'
import { ProvaCard } from './components/prova-card'
import { ResultRow } from './components/result-row'
import { SectionPanel } from './components/section-panel'
import { StatCard } from './components/stat-card'
import { ProvaCardSkeleton, ResultRowSkeleton, StatCardSkeleton } from './components/home-skeletons'

const RECENT_PROVAS_LIMIT = 6

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
  const { t } = useLingui()

  // Real reads against the in-process SQLite store (window.api → main).
  const { data: activeSession, isLoading: isSessionLoading } = useActiveSessionQuery()
  const examsQuery = useExamsQuery()
  const sessionsQuery = useSessionsQuery()
  const resultsQuery = useRecentResultsQuery()

  const exams = examsQuery.data ?? []
  const sessions = sessionsQuery.data ?? []
  const results = resultsQuery.data ?? []

  const stats = {
    provas: exams.length,
    // "Applied" = sessions that have actually run (started), not just drafted.
    sessions: sessions.filter((s) => s.startedAt !== null).length,
    studentsGraded: sessions.reduce((acc, s) => acc + s.submittedCount, 0)
  }
  const recentProvas = exams.slice(0, RECENT_PROVAS_LIMIT)

  // Delay skeletons so fast local reads don't flash them.
  const statsLoading = useDelayedLoading(examsQuery.isLoading || sessionsQuery.isLoading)
  const provasLoading = useDelayedLoading(examsQuery.isLoading)
  const resultsLoading = useDelayedLoading(resultsQuery.isLoading)

  // Map the live session row to the banner's shape.
  const live = activeSession
    ? {
        provaTitle: activeSession.examTitle,
        groups: activeSession.groups?.length ?? 0,
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

      {isSessionLoading ? (
        <div className="mb-5 h-20 animate-pulse rounded-2xl bg-muted/40" />
      ) : activeSession && live ? (
        <LiveSessionBanner session={live} />
      ) : null}

      <div className="mb-5 grid shrink-0 grid-cols-1 gap-4 sm:grid-cols-3">
        {statsLoading ? (
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
            />
            <StatCard
              tone="tertiary"
              icon={<FileText />}
              value={stats.sessions}
              label={<Trans>Sessões aplicadas</Trans>}
            />
            <StatCard
              tone="secondary"
              icon={<Users />}
              value={stats.studentsGraded}
              label={<Trans>Alunos avaliados</Trans>}
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
          {provasLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <ProvaCardSkeleton key={i} />
              ))}
            </div>
          ) : recentProvas.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {recentProvas.map((p) => (
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
          {resultsLoading ? (
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
