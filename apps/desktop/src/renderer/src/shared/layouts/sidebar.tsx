import { useState } from 'react'
import { ChartColumn, ClipboardList, House, Radio, Search, Settings, UserRound } from 'lucide-react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import type { MessageDescriptor } from '@lingui/core'
import logo from '@renderer/shared/assets/logo-icon.png'
import { Popover, PopoverContent, PopoverItem, PopoverTrigger } from '@renderer/shared/ui/popover'
import { cn } from '@renderer/shared/utils'
import { WindowControls } from '@renderer/shared/layouts/window-controls'
import { SidebarUser } from '@renderer/modules/auth/components/sidebar-user'
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

function SearchPopover(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const { t, i18n } = useLingui()

  const pages: NavItem[] = [...primaryNav, profileNav, settingsNav]

  const go = (to: NavTo): void => {
    setOpen(false)
    void navigate({ to })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-10 w-full items-center gap-2 rounded-[12px] border border-input-border bg-muted/50 px-3',
            'text-left text-sm text-muted-foreground',
            'shadow-[var(--edge-soft)] transition-[box-shadow,border-color] duration-150 outline-none',
            'hover:border-ring/40',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
            'data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/25'
          )}
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate">{t`Buscar…`}</span>
          <kbd className="rounded-[6px] border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
            ⌘K
          </kbd>
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-(--radix-popover-trigger-width) p-1.5"
      >
        {pages.map((p) => (
          <PopoverItem
            key={p.to}
            icon={<p.icon className="size-4" />}
            title={i18n._(p.label)}
            caption={p.caption ? i18n._(p.caption) : undefined}
            onClick={() => go(p.to)}
          />
        ))}
      </PopoverContent>
    </Popover>
  )
}

function NavRow({ item, active }: { item: NavItem; active: boolean }): React.JSX.Element {
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
    </Link>
  )
}

export function Sidebar(): React.JSX.Element {
  const pathname = useRouterState({ select: (s) => s.location.pathname })

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col overflow-hidden border-r border-border text-foreground"
      style={dragRegion}
    >
      {/* Chrome row — notifications + (frameless) min/max/close. The native
          macOS traffic lights sit over its empty left edge; the row itself stays
          draggable, only the buttons opt out. */}
      <div className="flex h-11 shrink-0 items-center justify-end px-2">
        <div className="flex items-center gap-0.5" style={noDragRegion}>
          <NotificationsMenu />
          <WindowControls />
        </div>
      </div>

      {/* Brand — doubles as a window-drag handle (no no-drag override). */}
      <div className="flex items-center gap-2.5 px-4 pt-1 pb-3">
        <img src={logo} alt="" aria-hidden draggable={false} className="size-7 select-none" />
        <span className="font-display text-[17px] font-extrabold tracking-tight">
          Offline<span className="text-primary">Class</span>
        </span>
      </div>

      <div className="px-3 pb-3" style={noDragRegion}>
        <SearchPopover />
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
          <NavRow key={item.to} item={item} active={item.to === pathname} />
        ))}
        <NavRow item={settingsNav} active={pathname === '/settings'} />
      </nav>

      <div className="mt-2 border-t border-border px-3 py-2" style={noDragRegion}>
        <SidebarUser />
      </div>
    </aside>
  )
}
