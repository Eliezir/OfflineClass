import { useEffect, useState } from 'react'
import { ChartColumn, ClipboardList, House, Radio, Search, Settings, UserRound } from 'lucide-react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import type { MessageDescriptor } from '@lingui/core'
import { Command } from 'cmdk'
import logo from '@renderer/shared/assets/logo-icon.png'
import { cn } from '@renderer/shared/utils'
import { getPlatform } from '@renderer/shared/utils/platform'
import { SidebarUser } from '@renderer/modules/auth/components/sidebar-user'
import { useActiveSessionQuery } from '@renderer/modules/sessao/queries'
import { NotificationsMenu } from './notifications-menu'

type NavTo = '/home' | '/provas' | '/sessao' | '/resultados' | '/profile' | '/settings'

type NavItem = {
  label: MessageDescriptor
  caption?: MessageDescriptor
  icon: React.ComponentType<{ className?: string }>
  to: NavTo
}

const primaryNav: NavItem[] = [
  { label: msg`Início`, caption: msg`Painel inicial`, icon: House, to: '/home' },
  { label: msg`Provas`, caption: msg`Suas avaliações`, icon: ClipboardList, to: '/provas' },
  { label: msg`Sessão`, caption: msg`Aplicar ao vivo`, icon: Radio, to: '/sessao' },
  { label: msg`Resultados`, caption: msg`Notas e relatórios`, icon: ChartColumn, to: '/resultados' }
]

const profileNav: NavItem = {
  label: msg`Perfil`,
  caption: msg`Seus dados de professor`,
  icon: UserRound,
  to: '/profile'
}

const settingsNav: NavItem = {
  label: msg`Configurações`,
  caption: msg`Preferências do app`,
  icon: Settings,
  to: '/settings'
}

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

function SearchCommand(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t, i18n } = useLingui()
  const shortcutLabel = getPlatform() === 'darwin' ? '⌘K' : 'Ctrl K'

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() !== 'k' || (!event.metaKey && !event.ctrlKey)) return
      event.preventDefault()
      setOpen((current) => !current)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const pages: NavItem[] = [...primaryNav, profileNav, settingsNav]

  const go = (to: NavTo): void => {
    setOpen(false)
    void navigate({ to })
  }

  return (
    <>
      <button
        type="button"
        aria-label={`${t`Buscar…`} (${shortcutLabel})`}
        aria-keyshortcuts="Meta+K Control+K"
        onClick={() => setOpen(true)}
        className={cn(
          'flex h-10 w-full items-center gap-2 rounded-[12px] border border-input-border bg-muted/50 px-3',
          'text-left text-sm text-muted-foreground',
          'shadow-[var(--edge-soft)] transition-[box-shadow,border-color] duration-150 outline-none',
          'hover:border-ring/40',
          'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25'
        )}
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 truncate">{t`Buscar…`}</span>
        <kbd className="rounded-[6px] border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
          {shortcutLabel}
        </kbd>
      </button>

      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label={t`Buscar páginas e comandos`}
        loop
        overlayClassName="fixed inset-0 z-60 bg-black/35 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0"
        contentClassName="fixed left-1/2 top-[18%] z-60 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <Search className="size-5 shrink-0 text-muted-foreground" />
          <Command.Input
            autoFocus
            placeholder={t`Buscar uma página…`}
            className="h-14 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Esc
          </kbd>
        </div>
        <Command.List className="scrollbar-subtle max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-4 py-10 text-center text-sm text-muted-foreground">
            {t`Nenhuma página encontrada.`}
          </Command.Empty>
          <Command.Group
            heading={t`Navegação`}
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase"
          >
            {pages.map((p) => (
              <Command.Item
                key={p.to}
                value={i18n._(p.label)}
                keywords={p.caption ? [i18n._(p.caption)] : undefined}
                onSelect={() => go(p.to)}
                className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm outline-none data-[selected=true]:bg-primary-soft data-[selected=true]:text-primary-soft-foreground"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted">
                  <p.icon className="size-4" />
                </span>
                <span className="flex min-w-0 flex-col">
                  <span className="font-semibold">{i18n._(p.label)}</span>
                  {p.caption && (
                    <span className="truncate text-xs text-muted-foreground">
                      {i18n._(p.caption)}
                    </span>
                  )}
                </span>
              </Command.Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command.Dialog>
    </>
  )
}

function NavRow({
  item,
  active,
  trailing
}: {
  item: NavItem
  active: boolean
  trailing?: React.ReactNode
}): React.JSX.Element {
  const { i18n } = useLingui()
  const rowClass = cn(
    'flex w-full items-center gap-3 rounded-[10px] px-2.5 py-2 text-sm font-bold',
    'transition-colors duration-200 [transition-timing-function:var(--ease-out)]',
    active
      ? 'bg-primary-soft text-primary'
      : 'text-foreground/70 hover:bg-foreground/[0.05] hover:text-foreground'
  )

  return (
    <Link to={item.to} className={rowClass} data-active={active ? 'true' : undefined}>
      <span className="grid size-6 shrink-0 place-items-center">
        <item.icon className="size-[18px]" />
      </span>
      <span className="truncate">{i18n._(item.label)}</span>
      {trailing}
    </Link>
  )
}

/**
 * Pulsing live-session pip on the "Sessão" row. Amber while the session waits
 * in the lobby, green once it's running. Hidden when there's no live session.
 */
function SessionDot(): React.JSX.Element | null {
  const { t } = useLingui()
  const { data: session } = useActiveSessionQuery()
  const status = session?.status

  if (status !== 'lobby' && status !== 'running') return null

  const live = status === 'running'
  const color = live ? 'bg-success' : 'bg-tertiary'

  return (
    <span className="relative ml-auto grid size-2.5 shrink-0 place-items-center">
      <span className={cn('absolute size-2.5 animate-ping rounded-full opacity-60', color)} />
      <span className={cn('relative size-2 rounded-full', color)} />
      <span className="sr-only">{live ? t`Sessão ao vivo` : t`Sessão no lobby`}</span>
    </span>
  )
}

export function Sidebar(): React.JSX.Element {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const isMac = getPlatform() === 'darwin'

  // A section stays highlighted on its sub-pages (e.g. /provas/123 keeps "Provas" lit).
  const isActive = (to: NavTo): boolean => pathname === to || pathname.startsWith(`${to}/`)

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border text-foreground"
      style={dragRegion}
    >
      {/* On macOS this row leaves room for the native traffic lights. On
          Windows/Linux it aligns the brand and notifications at the top. */}
      <div className="flex h-11 shrink-0 items-center justify-between px-2">
        {!isMac && (
          <div className="flex items-center gap-2.5 px-2">
            <img src={logo} alt="" aria-hidden draggable={false} className="size-7 select-none" />
            <span className="font-display text-[17px] font-extrabold tracking-tight">
              Offline<span className="text-primary">Class</span>
            </span>
          </div>
        )}
        <div className="flex items-center" style={noDragRegion}>
          <NotificationsMenu />
        </div>
      </div>

      {/* Brand — doubles as a window-drag handle (no no-drag override). */}
      {isMac && (
        <div className="flex items-center gap-2.5 px-4 pt-1 pb-3">
          <img src={logo} alt="" aria-hidden draggable={false} className="size-7 select-none" />
          <span className="font-display text-[17px] font-extrabold tracking-tight">
            Offline<span className="text-primary">Class</span>
          </span>
        </div>
      )}

      <div className="px-3 pb-3" style={noDragRegion}>
        <SearchCommand />
      </div>

      <div className="px-4 pt-1 pb-1.5" style={noDragRegion}>
        <span className="font-mono text-[10px] tracking-wider text-muted-foreground/70 uppercase">
          <Trans>Workspace</Trans>
        </span>
      </div>

      <nav
        className="scrollbar-subtle flex-1 space-y-0.5 overflow-y-auto px-3"
        style={noDragRegion}
      >
        {primaryNav.map((item) => (
          <NavRow
            key={item.to}
            item={item}
            active={isActive(item.to)}
            trailing={item.to === '/sessao' ? <SessionDot /> : undefined}
          />
        ))}
        <NavRow item={settingsNav} active={isActive('/settings')} />
      </nav>

      <div className="mt-2 border-t border-border px-3 py-2" style={noDragRegion}>
        <SidebarUser />
      </div>
    </aside>
  )
}
