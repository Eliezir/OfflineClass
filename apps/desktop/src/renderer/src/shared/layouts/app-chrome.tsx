import { useEffect, useState } from 'react'
import { Command, Minus, MoonStar, MoreHorizontal, Square, Sun, X } from 'lucide-react'
import { Button } from '@renderer/shared/ui/button'
import { cn } from '@renderer/shared/utils'
import { IPC } from '@shared/ipc/channels'

const THEME_STORAGE_KEY = 'offlineclass:theme'

function readSavedTheme(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const saved = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'dark') return true
    if (saved === 'light') return false
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function getPlatform(): NodeJS.Platform | 'web' {
  if (typeof window === 'undefined' || !window.electron) return 'web'
  return window.electron.process.platform as NodeJS.Platform
}

const dragRegion = { WebkitAppRegion: 'drag' } as React.CSSProperties
const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

export function AppChrome(): React.JSX.Element {
  const platform = getPlatform()
  const isMac = platform === 'darwin'
  const showWindowControls = platform !== 'darwin' && platform !== 'web'

  const [isDark, setIsDark] = useState<boolean>(readSavedTheme)
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }, [isDark])

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

  const handleMinimize = (): void => {
    void window.api.invoke(IPC.WINDOW.MINIMIZE)
  }

  const handleMaximizeToggle = async (): Promise<void> => {
    const r = await window.api.invoke(IPC.WINDOW.MAXIMIZE_TOGGLE)
    setIsMaximized(r.isMaximized)
  }

  const handleClose = (): void => {
    void window.api.invoke(IPC.WINDOW.CLOSE)
  }

  return (
    <header
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 bg-background px-3 select-none',
        isMac && 'pl-[78px]'
      )}
      style={dragRegion}
    >
      <div className="flex min-w-0 flex-1" />


      <div className="flex items-center gap-0.5" style={noDragRegion}>
        <Button variant="ghost" size="icon-sm" aria-label="Paleta de comandos">
          <Command />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Alternar tema"
          onClick={() => setIsDark((v) => !v)}
        >
          {isDark ? <Sun /> : <MoonStar />}
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Mais opções">
          <MoreHorizontal />
        </Button>

        {showWindowControls && (
          <>
            <span className="mx-1 h-5 w-px bg-border" aria-hidden />
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Minimizar"
              onClick={handleMinimize}
            >
              <Minus />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
              onClick={handleMaximizeToggle}
            >
              <Square />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Fechar"
              className="hover:bg-destructive hover:text-destructive-foreground"
              onClick={handleClose}
            >
              <X />
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
