import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from '@renderer/shared/hooks/use-prefers-reduced-motion'

type ProgressCycle = {
  /** Index of the active feature. */
  index: number
  /** 0→1 progress through the active feature's animation. */
  progress: number
  playing: boolean
  reduced: boolean
  togglePlaying: () => void
  goTo: (i: number) => void
}

/** rAF loop that advances `progress` 0→1 across a list of features, holding
    briefly between each and looping. Pass stable (module-level) arrays.
    When the user prefers reduced motion the loop never runs — each scene rests
    on its resolved frame (progress = 1) and the list stays manually navigable. */
export function useProgressCycle(durations: number[], holdMs: number[]): ProgressCycle {
  const count = durations.length
  const reduced = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(reduced ? 1 : 0)
  const [playing, setPlaying] = useState(!reduced)

  // rAF loop: advance `progress` toward 1 (pure — it only clamps; the hold and
  // advance are handled by the effect below). Stops feeding frames once settled.
  useEffect(() => {
    if (reduced || !playing || progress >= 1) return
    let raf = 0
    let last = performance.now()
    const loop = (now: number): void => {
      const dt = now - last
      last = now
      setProgress((p) => Math.min(1, p + dt / (durations[index] ?? 8000)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [reduced, playing, progress, index, durations])

  // Once a scene resolves, hold on its final frame, then advance (or stop on the
  // last one). Cleanup cancels a pending hold when index/progress change.
  useEffect(() => {
    if (reduced || !playing || progress < 1) return
    const timer = setTimeout(() => {
      if (index >= count - 1) {
        setPlaying(false)
        return
      }
      setIndex(index + 1)
      setProgress(0)
    }, holdMs[index] ?? 1200)
    return () => clearTimeout(timer)
  }, [reduced, playing, progress, index, count, holdMs])

  const togglePlaying = (): void => {
    // Finished (resting on the last frame): replay from the start.
    if (!playing && index >= count - 1 && progress >= 1) {
      goTo(0)
      return
    }
    setPlaying((p) => !p)
  }

  const goTo = (i: number): void => {
    setIndex(i)
    setProgress(reduced ? 1 : 0)
    if (!reduced) setPlaying(true)
  }

  return {
    index,
    progress,
    playing,
    reduced,
    togglePlaying,
    goTo
  }
}
