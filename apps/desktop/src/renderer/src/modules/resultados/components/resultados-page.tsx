import { useMemo, useState } from 'react'
import { ChartColumn, FlaskConical } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { Skeleton } from '@renderer/shared/ui/skeleton'
import { PageHeader } from '@renderer/shared/components/page-header'
import { buildMockEndedSessions } from '../mock-data'
import { useEndedSessionsQuery } from '../queries'
import { EndedSessionCard } from './ended-session-card'

type ResultadosPageProps = {
  mockMode: boolean
  onToggleMock: () => void
}

export function ResultadosPage({ mockMode, onToggleMock }: ResultadosPageProps): React.JSX.Element {
  const { t } = useLingui()
  const navigate = useNavigate()
  const query = useEndedSessionsQuery(!mockMode)
  const [now] = useState(() => Date.now())
  const mockSessions = useMemo(() => buildMockEndedSessions(now), [now])

  const sessions = mockMode ? mockSessions : (query.data ?? [])
  const loading = !mockMode && query.isLoading

  function open(sessionId: string): void {
    navigate({
      to: '/resultados/$sessionId',
      params: { sessionId },
      search: mockMode ? { mock: true } : {}
    })
  }

  return (
    <main className="scrollbar-subtle flex flex-1 flex-col overflow-y-auto px-6 pb-6">
      <PageHeader
        title={<Trans>Resultados</Trans>}
        subtitle={<Trans>Notas e correção das sessões encerradas.</Trans>}
        actions={
          import.meta.env.DEV && (
            <Button variant={mockMode ? 'default' : 'outline'} onClick={onToggleMock}>
              <FlaskConical />
              <Trans>Dados de teste</Trans>
            </Button>
          )
        }
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
