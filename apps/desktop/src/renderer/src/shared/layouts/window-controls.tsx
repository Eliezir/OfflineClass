import { useEffect, useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { useLingui } from '@lingui/react/macro'
import { Button } from '@renderer/shared/ui/button'
import { usesCustomWindowChrome } from '@renderer/shared/utils'
import { IPC } from '@shared/ipc/channels'

const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

/** Minimize / maximize / close cluster for frameless Windows/Linux, rendered
    inside the topbar. Null on macOS (native traffic lights) and web. */
export function WindowControls(): React.JSX.Element | null {
  const { t } = useLingui()
  const showWindowControls = usesCustomWindowChrome()

  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!showWindowControls) return
    let cancelled = false
    window.api.invoke(IPC.WINDOW.IS_MAXIMIZED).then((r) => {
      if (!cancelled) setIsMaximized(r.isMaximized)
    })
    // Stay in sync when the OS changes the maximize state (snap, double-click…).
    const unsubscribe = window.api.on(IPC.WINDOW.MAXIMIZE_CHANGED, (p) => {
      setIsMaximized(p.isMaximized)
    })
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [showWindowControls])

  if (!showWindowControls) return null

  return (
    <div className="flex items-center gap-0.5" style={noDragRegion}>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={t`Minimizar`}
        onClick={() => void window.api.invoke(IPC.WINDOW.MINIMIZE)}
      >
        <Minus />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={isMaximized ? t`Restaurar` : t`Maximizar`}
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
        aria-label={t`Fechar`}
        className="hover:bg-destructive hover:text-destructive-foreground"
        onClick={() => void window.api.invoke(IPC.WINDOW.CLOSE)}
      >
        <X />
      </Button>
    </div>
  )
}
