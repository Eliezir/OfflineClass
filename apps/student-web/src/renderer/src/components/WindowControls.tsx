import { useEffect, useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isElectron } from '@/lib/platform'

const noDragRegion = { WebkitAppRegion: 'no-drag' } as React.CSSProperties

/** Minimize / maximize / close cluster for frameless Windows/Linux.
    Returns null when running in a browser (dev mode). */
export function WindowControls(): React.JSX.Element | null {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    if (!isElectron()) return
    let cancelled = false

    window.api.window.isMaximized().then((r) => {
      if (!cancelled) setIsMaximized(r.isMaximized)
    })

    const unsubscribe = window.api.window.onMaximizeChanged((val) => {
      setIsMaximized(val)
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  if (!isElectron()) return null

  return (
    <div className="flex items-center gap-0.5" style={noDragRegion}>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Minimizar"
        onClick={() => void window.api.window.minimize()}
      >
        <Minus />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label={isMaximized ? 'Restaurar' : 'Maximizar'}
        onClick={async () => {
          const r = await window.api.window.maximizeToggle()
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
        onClick={() => void window.api.window.close()}
      >
        <X />
      </Button>
    </div>
  )
}
