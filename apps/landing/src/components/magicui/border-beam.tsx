import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

interface BorderBeamProps {
  className?: string
  /** Kept for API compatibility; no longer used. */
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
  borderWidth?: number
}

/**
 * A thin highlight that travels around the element's border. Implemented as a
 * rotating conic gradient masked to the border ring — works reliably across
 * engines (no offset-path), and stays subtle.
 */
export function BorderBeam({
  className,
  duration = 8,
  delay = 0,
  colorFrom = 'oklch(0.7 0.19 295)',
  colorTo = 'oklch(0.78 0.13 320)',
  borderWidth = 1.5,
}: BorderBeamProps) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 rounded-[inherit]', className)}
      style={
        {
          padding: borderWidth,
          background: `conic-gradient(from var(--bb-angle), transparent 0deg, ${colorFrom} 60deg, ${colorTo} 110deg, transparent 170deg)`,
          WebkitMask:
            'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          animation: `bb-spin ${duration}s linear infinite`,
          animationDelay: `${-delay}s`,
        } as CSSProperties
      }
    />
  )
}
