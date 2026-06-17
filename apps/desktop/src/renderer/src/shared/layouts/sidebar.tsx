import { Search } from 'lucide-react'
import { Link, useRouterState } from '@tanstack/react-router'
import { Trans, useLingui } from '@lingui/react/macro'
import logo from '@renderer/shared/assets/logo-icon.png'
import { cn } from '@renderer/shared/utils'
import { WindowControls } from '@renderer/shared/layouts/window-controls'
import { primaryNav, settingsNav, type NavItem } from '@renderer/shared/layouts/nav-items'
import { useCommandPalette } from '@renderer/shared/components/command-palette-context'
import { SidebarUser } from '@renderer/modules/auth/components/sidebar-user'
import { NotificationsMenu } from './notifications-menu'

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

/** Opens the ⌘K command palette — the search field is its entry point. */
function SearchButton(): React.JSX.Element {
  const { open } = useCommandPalette()
  const { t } = useLingui()

  return (
    <button
      type="button"
      onClick={open}
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
        ⌘K
      </kbd>
    </button>
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
        <SearchButton />
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
