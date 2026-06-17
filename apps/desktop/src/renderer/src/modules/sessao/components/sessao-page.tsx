import { useEffect, useState } from 'react'
import { Loader2, Play, Square } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import type { SessionCreateInput } from '@offlineclass/shared'
import { Button } from '@renderer/shared/ui/button'
import { ipcErrorMessage } from '@renderer/shared/utils'
import { PageHeader } from '@renderer/shared/components/page-header'
import { useExamsQuery } from '@renderer/modules/provas/queries'
import type { SessionDetail } from '../types'
import { useActiveSessionQuery, useCreateSession, useEndSession, useStartSession } from '../queries'
import { Countdown } from './countdown'
import { LiveDashboard } from './live-dashboard'
import { LobbyPanel } from './lobby-panel'
import { NoSession } from './no-session'
import { SessionEnded } from './session-ended'
import { StatusPill } from './status-pill'

export function SessaoPage(): React.JSX.Element {
  const { t } = useLingui()
  const { data: active, isLoading } = useActiveSessionQuery()
  const exams = useExamsQuery()
  const create = useCreateSession()
  const start = useStartSession()
  const end = useEndSession()

  // After a running session ends we keep its detail locally to show the summary
  // (the active query goes null once it's no longer lobby/running).
  const [endedDetail, setEndedDetail] = useState<SessionDetail | null>(null)

  // Ticks for relative "há X min" labels; the countdown self-ticks separately.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000)
    return () => clearInterval(id)
  }, [])

  const session = endedDetail ?? active ?? null
  const phase = endedDetail ? 'ended' : (active?.status ?? 'none')

  function handleOpen(input: SessionCreateInput): void {
    setEndedDetail(null)
    create.mutate(input)
  }
  function handleStart(): void {
    if (active) start.mutate(active.id)
  }
  async function handleEnd(): Promise<void> {
    if (!active) return
    const detail = await end.mutateAsync(active.id)
    setEndedDetail(detail)
  }
  async function handleCancel(): Promise<void> {
    if (!active) return
    await end.mutateAsync(active.id)
    setEndedDetail(null)
  }
  function handleNew(): void {
    setEndedDetail(null)
  }

  const ending = end.isPending

  return (
    <main className="flex flex-1 flex-col overflow-hidden px-6 pb-6">
      <PageHeader
        title={<Trans>Sessão</Trans>}
        subtitle={
          session && phase !== 'none' ? (
            <span className="flex items-center gap-2">
              <StatusPill status={session.status} />
              <span className="font-semibold text-foreground">{session.examTitle}</span>
              {session.status === 'running' && session.startedAt && (
                <Countdown
                  startedAt={session.startedAt}
                  durationMinutes={session.durationMinutes}
                />
              )}
            </span>
          ) : (
            <Trans>Aplique uma prova ao vivo para a turma.</Trans>
          )
        }
        actions={
          <>
            {phase === 'lobby' && (
              <>
                <Button variant="ghost" onClick={handleCancel} disabled={ending}>
                  <Trans>Cancelar</Trans>
                </Button>
                <Button onClick={handleStart} disabled={start.isPending}>
                  <Play />
                  <Trans>Iniciar prova</Trans>
                </Button>
              </>
            )}
            {phase === 'running' && (
              <Button variant="outline-primary" onClick={handleEnd} disabled={ending}>
                <Square />
                <Trans>Encerrar sessão</Trans>
              </Button>
            )}
          </>
        }
      />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : phase === 'none' ? (
        <NoSession
          provas={exams.data ?? []}
          loadingProvas={exams.isLoading}
          pending={create.isPending}
          error={
            create.isError
              ? ipcErrorMessage(create.error, t`Não foi possível abrir a sessão.`)
              : null
          }
          onOpen={handleOpen}
        />
      ) : phase === 'lobby' && session ? (
        <LobbyPanel session={session} />
      ) : phase === 'running' && session ? (
        <LiveDashboard session={session} now={now} />
      ) : phase === 'ended' && session ? (
        <SessionEnded session={session} onNew={handleNew} />
      ) : null}
    </main>
  )
}
