import { useLayoutEffect, useRef, useState } from 'react'
import { cn } from '@renderer/shared/utils'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  icon?: React.ReactNode
}

type SegmentedProps<T extends string> = {
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  ariaLabel: string
  disabled?: boolean
  /** Stretch to fill the container with equal-width segments. */
  fullWidth?: boolean
  className?: string
}

/** Generic segmented control with a gliding pill. Measures the active segment
    (not percentage math) so it stays correct for any label widths. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  disabled,
  fullWidth,
  className
}: SegmentedProps<T>): React.JSX.Element {
  const trackRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const active = trackRef.current?.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) return
    setPill({ left: active.offsetLeft, width: active.offsetWidth })
  }, [value, options.length])

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'relative rounded-full border border-border bg-muted/50 p-1',
        fullWidth ? 'flex w-full' : 'inline-flex',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1 bottom-1 left-0 rounded-full',
          'bg-card shadow-[var(--edge-soft)] ring-1 ring-border',
          'transition-[transform,width,opacity] duration-300 [transition-timing-function:var(--ease-snap)]',
          'will-change-transform',
          pill ? 'opacity-100' : 'opacity-0'
        )}
        style={{ width: pill?.width ?? 0, transform: `translate3d(${pill?.left ?? 0}px, 0, 0)` }}
      />

      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            data-active={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative z-10 inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-full px-3 py-1.5',
              'text-sm font-medium outline-none transition-colors duration-200 [transition-timing-function:var(--ease-out)]',
              'focus-visible:ring-[3px] focus-visible:ring-ring/25',
              fullWidth && 'flex-1',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.icon}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
