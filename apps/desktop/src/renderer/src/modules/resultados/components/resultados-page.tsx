import { ChartColumn } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { PageHeader } from '@renderer/shared/components/page-header'
import { useEndedSessionsQuery } from '../queries'
import { EndedSessionCard } from './ended-session-card'

export function ResultadosPage(): React.JSX.Element {
  const { t } = useLingui()
  const navigate = useNavigate()
  const query = useEndedSessionsQuery()

  const sessions = query.data ?? []
  const loading = query.isLoading

  function open(sessionId: string): void {
    navigate({ to: '/resultados/$sessionId', params: { sessionId } })
  }

  return (
    <main className="scrollbar-subtle flex flex-1 flex-col overflow-y-auto px-6 pb-6">
      <PageHeader
        title={<Trans>Resultados</Trans>}
        subtitle={<Trans>Notas e correção das sessões encerradas.</Trans>}
      />

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-2xl" />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <EmptyState
          icon={<ChartColumn />}
          title={t`Nenhuma sessão encerrada`}
          description={
            <Trans>Os resultados aparecem aqui depois que você encerra uma sessão.</Trans>
          }
        />
      ) : (
        <div className="flex flex-col gap-3">
          {sessions.map((s) => (
            <EndedSessionCard key={s.id} session={s} onOpen={() => open(s.id)} />
          ))}
        </div>
      )}
    </main>
  )
}
