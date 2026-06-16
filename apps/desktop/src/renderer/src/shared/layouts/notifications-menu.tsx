import { useState } from 'react'
import { Bell, CircleCheck, CircleX, Info, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { msg, plural } from '@lingui/core/macro'
import { Plural, Trans, useLingui } from '@lingui/react/macro'
import type { MessageDescriptor } from '@lingui/core'
import { Button } from '@renderer/shared/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@renderer/shared/ui/popover'
import { cn } from '@renderer/shared/utils'
import { SleepingBell } from './sleeping-bell'

const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

type Tone = 'info' | 'success' | 'warning' | 'error'

type AppNotification = {
  id: string
  title: MessageDescriptor
  description: MessageDescriptor
  time: MessageDescriptor
  read: boolean
  tone: Tone
}

const TONES: Record<Tone, { Icon: LucideIcon; className: string }> = {
  info: { Icon: Info, className: 'text-primary' },
  success: { Icon: CircleCheck, className: 'text-success' },
  warning: { Icon: TriangleAlert, className: 'text-warning' },
  error: { Icon: CircleX, className: 'text-destructive' }
}

// Illustrative for now — no real notification system yet. Swap for live data later.
const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: '1',
    title: msg`Sessão encerrada`,
    description: msg`A sessão da “Prova de Redes” foi encerrada.`,
    time: msg`agora`,
    read: false,
    tone: 'success'
  },
  {
    id: '2',
    title: msg`Resultados prontos`,
    description: msg`As notas da Turma A já estão disponíveis.`,
    time: msg`há 2 h`,
    read: false,
    tone: 'info'
  },
  {
    id: '3',
    title: msg`Aluno desconectado`,
    description: msg`Maria saiu da sessão e pode ter perdido a conexão.`,
    time: msg`há 3 h`,
    read: false,
    tone: 'warning'
  },
  {
    id: '4',
    title: msg`Falha ao exportar`,
    description: msg`Não foi possível exportar o CSV. Tente novamente.`,
    time: msg`ontem`,
    read: true,
    tone: 'error'
  },
  {
    id: '5',
    title: msg`Prova salva`,
    description: msg`“Prova de SO” foi salva no seu computador.`,
    time: msg`ontem`,
    read: true,
    tone: 'success'
  },
  {
    id: '6',
    title: msg`Nova versão disponível`,
    description: msg`Atualize para a 1.2.0 para as últimas melhorias.`,
    time: msg`2 dias`,
    read: true,
    tone: 'info'
  }
]

const EXIT_MS = 220

type PopoverContentProps = React.ComponentProps<typeof PopoverContent>

/** Where the panel opens relative to the bell. Defaults match the sidebar
    placement (opens to the right); the topbar passes a downward/right-aligned
    placement. */
type NotificationsMenuProps = {
  side?: PopoverContentProps['side']
  align?: PopoverContentProps['align']
  sideOffset?: number
  alignOffset?: number
}

export function NotificationsMenu({
  side = 'right',
  align = 'start',
  sideOffset = 28,
  alignOffset = 12
}: NotificationsMenuProps = {}): React.JSX.Element {
  const { t, i18n } = useLingui()
  const [items, setItems] = useState(INITIAL_NOTIFICATIONS)
  // Ids mid-exit: kept briefly so the row can collapse/fade before it's removed.
  const [removing, setRemoving] = useState<string[]>([])
  const unread = items.filter((n) => !n.read).length

  const dismiss = (id: string): void => {
    setRemoving((prev) => [...prev, id])
    setTimeout(() => {
      setItems((prev) => prev.filter((n) => n.id !== id))
      setRemoving((prev) => prev.filter((x) => x !== id))
    }, EXIT_MS)
  }

  const dismissAll = (): void => {
    setRemoving(items.map((n) => n.id))
    setTimeout(() => {
      setItems([])
      setRemoving([])
    }, EXIT_MS)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={
            unread
              ? t`Notificações (${plural(unread, { one: '# não lida', other: '# não lidas' })})`
              : t`Notificações`
          }
          className="relative"
          style={noDragRegion}
        >
          <Bell />
          {unread > 0 && (
            <span className="absolute top-1 right-1 size-1.5 rounded-full bg-primary ring-2 ring-canvas" />
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        side={side}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
        className="w-80 p-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              <Trans>Notificações</Trans>
            </span>
            {unread > 0 && (
              <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">
                <Plural value={unread} one="# nova" other="# novas" />
              </span>
            )}
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={dismissAll}
              className="cursor-pointer rounded-md px-1.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            >
              <Trans>Limpar tudo</Trans>
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex animate-in flex-col items-center gap-1 px-3 pt-6 pb-8 text-center fade-in duration-300">
            <SleepingBell />
            <p className="mt-2 text-sm font-medium text-foreground">
              <Trans>Nenhuma notificação</Trans>
            </p>
            <p className="text-xs text-pretty text-muted-foreground">
              <Trans>Tudo em dia — avisaremos quando algo novo chegar.</Trans>
            </p>
          </div>
        ) : (
          <div className="scrollbar-subtle max-h-80 overflow-y-auto py-1">
            {items.map((n) => {
              const { Icon, className } = TONES[n.tone]
              const isRemoving = removing.includes(n.id)
              return (
                <div
                  key={n.id}
                  className={cn(
                    'overflow-hidden transition-[max-height,opacity,transform] duration-200 [transition-timing-function:var(--ease-out)] motion-reduce:transition-none',
                    isRemoving ? 'max-h-0 -translate-x-3 opacity-0' : 'max-h-32 opacity-100'
                  )}
                >
                  <div className="group flex gap-2.5 px-3 py-2.5 transition-colors hover:bg-foreground/[0.04]">
                    <Icon className={cn('mt-0.5 size-4 shrink-0', className)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {i18n._(n.title)}
                        </span>
                        {!n.read && <span className="size-1.5 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-0.5 text-xs text-pretty text-muted-foreground">
                        {i18n._(n.description)}
                      </p>
                      <span className="mt-1 block text-[11px] text-muted-foreground/60">
                        {i18n._(n.time)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => dismiss(n.id)}
                      aria-label={t`Dispensar notificação`}
                      className="mt-0.5 grid size-6 shrink-0 cursor-pointer place-items-center rounded-md text-muted-foreground opacity-0 transition-[opacity,background-color,color] hover:bg-foreground/10 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
