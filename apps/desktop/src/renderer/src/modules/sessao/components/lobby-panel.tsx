import { useState } from 'react'
import { Check, Clock, Copy, Loader2, LogIn, QrCode, Users } from 'lucide-react'
import { Trans, useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { EmptyState } from '@renderer/shared/ui/empty-state'
import { useDiscoveryQuery } from '../queries'
import type { SessionDetail } from '../types'
import { RosterCard } from './roster-card'

type LobbyPanelProps = {
  session: SessionDetail
}

/** Lobby: how-to-join card on the left, roster on the right. */
export function LobbyPanel({ session }: LobbyPanelProps): React.JSX.Element {
  const { t } = useLingui()
  const discovery = useDiscoveryQuery(true)
  const [copied, setCopied] = useState(false)

  // Match the scheme the QR encodes — the LAN server is HTTPS-only, so a
  // scheme-less address would resolve to http and fail to connect.
  const joinUrl = discovery.data ? `https://${discovery.data.lanIp}:${discovery.data.port}` : null
  const students = session.students

  async function copyUrl(): Promise<void> {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">
      {/* Join info */}
      <section className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-bold">
          <Trans>Como os alunos entram</Trans>
        </h2>

        <div className="grid aspect-square w-full place-items-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground">
          {discovery.data?.qrDataUrl ? (
            <img
              src={discovery.data.qrDataUrl}
              alt={t`QR code para entrar na sessão`}
              className="size-full object-contain p-3"
            />
          ) : discovery.isLoading ? (
            <Loader2 className="size-8 animate-spin" />
          ) : (
            <div className="flex flex-col items-center gap-2">
              <QrCode className="size-20" strokeWidth={1.25} />
              <span className="text-xs font-semibold">
                <Trans>QR indisponível</Trans>
              </span>
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-bold text-muted-foreground">
            <Trans>Endereço na rede</Trans>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <code className="flex-1 truncate rounded-[10px] border border-input-border bg-input px-3 py-2 font-mono text-sm font-bold">
              {joinUrl ?? '—'}
            </code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={copyUrl}
              disabled={!joinUrl}
              aria-label={t`Copiar endereço`}
              title={t`Copiar endereço`}
            >
              {copied ? <Check className="text-success" /> : <Copy />}
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3.5" />
            {session.durationMinutes} min
          </span>
          <span className="inline-flex items-center gap-1.5">
            <LogIn className="size-3.5" />
            {session.allowLateJoin ? (
              <Trans>Entrada tardia: sim</Trans>
            ) : (
              <Trans>Entrada tardia: não</Trans>
            )}
          </span>
        </div>
      </section>

      {/* Roster */}
      <section className="flex min-h-0 flex-col rounded-2xl border border-border bg-card p-5">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <h2 className="text-sm font-bold">
            <Trans>Alunos na sala</Trans>
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary-soft-foreground">
            <Users className="size-3.5" />
            {students.length}
          </span>
        </div>

        {students.length > 0 ? (
          <div className="scrollbar-subtle mt-3 grid min-h-0 flex-1 content-start gap-3 overflow-y-auto pr-1 [grid-template-columns:repeat(auto-fill,minmax(132px,1fr))]">
            {students.map((s) => (
              <RosterCard key={s.id} student={s} />
            ))}
          </div>
        ) : (
          <div className="mt-3 flex min-h-0 flex-1 items-center justify-center">
            <EmptyState
              compact
              icon={<Users />}
              title={t`Aguardando alunos`}
              description={<Trans>Os alunos aparecem aqui assim que entram pela rede.</Trans>}
            />
          </div>
        )}
      </section>
    </div>
  )
}
