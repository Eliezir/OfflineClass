import { useLayoutEffect, useState } from 'react'

import { cn } from '@renderer/shared/utils'

/** Absolute-positioned pill that tracks the `[data-active='true']` element inside
    `containerRef`. Drop it inside a `relative` container alongside the rows; pass
    visual styling (bg, border, rounded, horizontal inset) via `className`. */
export function SlidingHighlight({
  containerRef,
  deps,
  className
}: {
  containerRef: React.RefObject<HTMLElement | null>
  deps: React.DependencyList
  className?: string
}): React.JSX.Element {
  const [pos, setPos] = useState<{ top: number; height: number } | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const active = container.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) {
      setPos(null)
      return
    }
    const cRect = container.getBoundingClientRect()
    const aRect = active.getBoundingClientRect()
    setPos({ top: aRect.top - cRect.top, height: aRect.height })
  }, deps)

  // translate3d + seeded `top:0` so the first move glides instead of fading:
  // CSS transitions need a defined "from" value.
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute top-0',
        'transition-[transform,height,opacity] duration-260 ease-out',
        'will-change-transform',
        pos ? 'opacity-100' : 'opacity-0',
        className
      )}
      style={{
        height: pos?.height ?? 0,
        transform: `translate3d(0, ${pos?.top ?? 0}px, 0)`
      }}
    />
  )
}
