import { useEffect, useRef, useState } from 'react'
import {
  ClipboardList,
  GraduationCap,
  Home,
  Minus,
  Radio,
  Search,
  Settings,
  Square,
  X
} from 'lucide-react'
import { Link, useNavigate, useRouterState } from '@tanstack/react-router'
import { Button } from '@renderer/shared/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverItem,
  PopoverTrigger
} from '@renderer/shared/ui/popover'
import { SlidingHighlight } from '@renderer/shared/ui/sliding-highlight'
import { cn } from '@renderer/shared/utils'
import { IPC } from '@shared/ipc/channels'

type NavTo = '/home' | '/exams' | '/sessions' | '/students' | '/settings'

type NavItem = {
  label: string
  caption?: string
  icon: React.ComponentType<{ className?: string }>
  to: NavTo
}

const primaryNav: NavItem[] = [
  { label: 'Início', caption: 'Painel geral', icon: Home, to: '/home' },
  { label: 'Provas', caption: 'Biblioteca de provas', icon: ClipboardList, to: '/exams' },
  { label: 'Sessões', caption: 'Sessões ao vivo', icon: Radio, to: '/sessions' },
  { label: 'Alunos', caption: 'Histórico de turmas', icon: GraduationCap, to: '/students' }
]

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

function getPlatform(): NodeJS.Platform | 'web' {
  if (typeof window === 'undefined' || !window.electron) return 'web'
  return window.electron.process.platform as NodeJS.Platform
}

function SearchPopover(): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const pages: NavItem[] = [
    ...primaryNav,
    {
      label: 'Configurações',
      caption: 'Preferências do app',
      icon: Settings,
      to: '/settings'
    }
  ]

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
            'flex h-10 w-full items-center gap-2 rounded-[10px] border border-input-border bg-input px-3',
            'text-left text-sm text-muted-foreground',
            'shadow-[var(--edge-soft)] transition-[box-shadow,border-color] duration-150 outline-none',
            'hover:border-ring/40',
            'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
            'data-[state=open]:border-ring data-[state=open]:ring-[3px] data-[state=open]:ring-ring/25'
          )}
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate">Buscar provas, sessões, alunos…</span>
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
            title={p.label}
            caption={p.caption}
            onClick={() => go(p.to)}
          />
        ))}
      </PopoverContent>
    </Popover>
  )
}

function NavRow({ item, active }: { item: NavItem; active: boolean }): React.JSX.Element {
  const rowClass = cn(
    'relative z-10 flex w-full items-center gap-3 rounded-[8px] px-2 py-1.5 text-sm font-medium',
    'transition-colors duration-200 [transition-timing-function:var(--ease-out)]',
    active
      ? 'text-foreground'
      : 'text-foreground/75 hover:bg-foreground/[0.06] hover:text-foreground dark:hover:bg-foreground/[0.05]'
  )

  return (
    <Link to={item.to} className={rowClass} data-active={active ? 'true' : undefined}>
      <span className="grid size-7 shrink-0 place-items-center">
        <item.icon className="size-4" />
      </span>
      <span className="truncate">{item.label}</span>
    </Link>
  )
}

export function Sidebar(): React.JSX.Element {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const platform = getPlatform()
  const showWindowControls = platform !== 'darwin' && platform !== 'web'

  const [isMaximized, setIsMaximized] = useState(false)
  const primaryNavRef = useRef<HTMLElement>(null)
  const settingsActive = pathname === '/settings'

  useEffect(() => {
    if (!showWindowControls) return
    let cancelled = false
    window.api.invoke(IPC.WINDOW.IS_MAXIMIZED).then((r) => {
      if (!cancelled) setIsMaximized(r.isMaximized)
    })
    return () => {
      cancelled = true
    }
  }, [showWindowControls])

  return (
    <aside
      className="flex h-full w-64 shrink-0 flex-col overflow-hidden text-foreground"
      style={dragRegion}
    >
      <div className="flex h-12 shrink-0 items-center justify-end gap-0.5 pr-2">
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          aria-label="Configurações"
          className={cn(settingsActive && 'bg-foreground/8 text-foreground')}
          style={noDragRegion}
        >
          <Link to="/settings">
            <Settings />
          </Link>
        </Button>
        {showWindowControls && (
          <div className="flex items-center gap-0.5" style={noDragRegion}>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Minimizar"
              onClick={() => void window.api.invoke(IPC.WINDOW.MINIMIZE)}
            >
              <Minus />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
              onClick={async () => {
                const r = await window.api.invoke(IPC.WINDOW.MAXIMIZE_TOGGLE)
                setIsMaximized(r.isMaximized)
              }}
            >
              <Square />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label="Fechar"
              className="hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => void window.api.invoke(IPC.WINDOW.CLOSE)}
            >
              <X />
            </Button>
          </div>
        )}
      </div>

      <div className="px-3 pb-3 pt-1" style={noDragRegion}>
        <SearchPopover />
      </div>

      <div className="px-4 pb-1.5 pt-1" style={noDragRegion}>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
          Workspace
        </span>
      </div>

      <nav
        ref={primaryNavRef}
        className="relative flex-1 space-y-0.5 overflow-y-auto px-3"
        style={noDragRegion}
      >
        <SlidingHighlight
          containerRef={primaryNavRef}
          deps={[pathname]}
          className="left-3 right-3 rounded-[8px] border border-border bg-card shadow-sm"
        />
        {primaryNav.map((item) => (
          <NavRow key={item.label} item={item} active={item.to === pathname} />
        ))}
      </nav>

    </aside>
  )
}
