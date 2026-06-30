import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { SlideView, slides, pad } from './docs-slides'

const total = slides.length

/** Fullscreen, one-slide-at-a-time presentation player over the docs deck. */
export function DocsPresent({
  start = 0,
  onClose,
}: {
  start?: number
  onClose: () => void
}) {
  const [index, setIndex] = useState(() => Math.min(Math.max(start, 0), total - 1))
  const [uiVisible, setUiVisible] = useState(true)
  const rootRef = useRef<HTMLDivElement>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const go = useCallback((delta: number) => {
    setIndex((i) => Math.min(Math.max(i + delta, 0), total - 1))
  }, [])

  // Request fullscreen on mount; close when the user leaves fullscreen.
  useEffect(() => {
    const el = rootRef.current
    el?.requestFullscreen?.().catch(() => {})
    const onFsChange = () => {
      if (!document.fullscreenElement) onClose()
    }
    document.addEventListener('fullscreenchange', onFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange)
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {})
    }
  }, [onClose])

  // Keyboard navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault()
        go(1)
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'Home') {
        setIndex(0)
      } else if (e.key === 'End') {
        setIndex(total - 1)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onClose])

  // Auto-hide the chrome after a moment of stillness.
  const wake = useCallback(() => {
    setUiVisible(true)
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => setUiVisible(false), 2500)
  }, [])
  useEffect(() => {
    wake()
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [wake, index])

  const slide = slides[index]

  return (
    <div
      ref={rootRef}
      onMouseMove={wake}
      className={cn(
        'fixed inset-0 z-[100] flex flex-col bg-background',
        uiVisible ? 'cursor-default' : 'cursor-none',
      )}
    >
      {/* progress bar */}
      <div className="absolute inset-x-0 top-0 z-10 h-1 bg-border/60">
        <div
          className="h-full bg-primary transition-[width] duration-300"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* exit */}
      <div
        className={cn(
          'absolute top-4 right-4 z-20 transition-opacity',
          uiVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <Button variant="outline" size="icon" onClick={onClose} aria-label="Sair da apresentação">
          <X className="size-5" />
        </Button>
      </div>

      {/* click zones for prev / next */}
      <button
        type="button"
        aria-label="Slide anterior"
        onClick={() => go(-1)}
        disabled={index === 0}
        className="absolute inset-y-0 left-0 z-0 w-1/4 cursor-w-resize disabled:cursor-default"
      />
      <button
        type="button"
        aria-label="Próximo slide"
        onClick={() => go(1)}
        disabled={index === total - 1}
        className="absolute inset-y-0 right-0 z-0 w-1/4 cursor-e-resize disabled:cursor-default"
      />

      {/* current slide */}
      <div className="flex flex-1 items-stretch justify-center overflow-auto p-4 sm:p-8">
        <div
          key={slide.key}
          className="mx-auto flex w-full max-w-7xl animate-in fade-in duration-300 [&>*]:w-full"
        >
          <SlideView slide={slide} present />
        </div>
      </div>

      {/* bottom control bar */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-4 p-5 transition-opacity',
          uiVisible ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(-1)}
          disabled={index === 0}
          aria-label="Slide anterior"
        >
          <ChevronLeft className="size-5" />
        </Button>
        <span className="min-w-[5ch] text-center font-mono text-sm tabular-nums text-muted-foreground">
          {pad(index + 1)} / {pad(total)}
        </span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => go(1)}
          disabled={index === total - 1}
          aria-label="Próximo slide"
        >
          <ChevronRight className="size-5" />
        </Button>
      </div>
    </div>
  )
}
