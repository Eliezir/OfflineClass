import { useLayoutEffect, useRef, useState } from 'react'
import { useLingui } from '@lingui/react/macro'
import { PROVIDERS, type ProviderId } from '@renderer/shared/services/ai-providers'
import { cn } from '@renderer/shared/utils'
import { PROVIDER_VISUALS } from './provider-visuals'

type ProviderToggleProps = {
  value: ProviderId
  onChange: (id: ProviderId) => void
}

/** Segmented switch: a pill glides between the options. We measure the active
    button instead of doing percentage math so it stays correct regardless of
    label width, padding, or gap. */
export function ProviderToggle({ value, onChange }: ProviderToggleProps): React.JSX.Element {
  const { t } = useLingui()
  const trackRef = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null)

  useLayoutEffect(() => {
    const track = trackRef.current
    if (!track) return
    const active = track.querySelector<HTMLElement>('[data-active="true"]')
    if (!active) return
    setPill({ left: active.offsetLeft, width: active.offsetWidth })
  }, [value])

  return (
    <div
      ref={trackRef}
      role="radiogroup"
      aria-label={t`Provedor de IA`}
      className="relative grid grid-cols-2 gap-1 rounded-full border border-border bg-muted/50 p-1"
    >
      {/* The gliding pill — seeded at top-1/bottom-1 so the first paint has a
          defined "from" and the move animates instead of popping in. */}
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute top-1 bottom-1 left-0 rounded-full',
          'bg-card shadow-[var(--edge-soft),0_1px_3px_oklch(0_0_0/0.10)] ring-1 ring-primary/25',
          'transition-[transform,width,opacity] duration-300 [transition-timing-function:var(--ease-snap)]',
          'will-change-transform',
          pill ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          width: pill?.width ?? 0,
          transform: `translate3d(${pill?.left ?? 0}px, 0, 0)`
        }}
      />

      {PROVIDERS.map((provider) => {
        const selected = provider.id === value
        const { Icon, accent } = PROVIDER_VISUALS[provider.id]
        return (
          <button
            key={provider.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-active={selected}
            onClick={() => onChange(provider.id)}
            className={cn(
              'relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2',
              'cursor-pointer text-sm font-semibold outline-none',
              'transition-colors duration-200 [transition-timing-function:var(--ease-out)]',
              'focus-visible:ring-[3px] focus-visible:ring-ring/25',
              selected ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon
              className="size-4 shrink-0 transition-colors duration-200"
              style={selected ? { color: accent } : undefined}
            />
            {provider.label}
          </button>
        )
      })}
    </div>
  )
}
