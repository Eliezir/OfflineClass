import { useCallback, useLayoutEffect, useState } from 'react'

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

  const measure = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const active = container.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) {
      setPos(null)
      return
    }
    const cRect = container.getBoundingClientRect()
    const aRect = active.getBoundingClientRect()
    if (aRect.height === 0) {
      setPos(null)
      return
    }
    setPos({ top: aRect.top - cRect.top, height: aRect.height })
  }, [containerRef])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(measure, deps)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    observer.observe(container)
    return () => observer.disconnect()
  }, [containerRef, measure])

  useLayoutEffect(() => {
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts
    if (!fonts?.ready) return
    let cancelled = false
    void fonts.ready.then(() => {
      if (!cancelled) measure()
    })
    return () => {
      cancelled = true
    }
  }, [measure])

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
