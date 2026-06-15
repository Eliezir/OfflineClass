import { Check, LoaderCircle, X } from 'lucide-react'
import type { CheckStatus, ProviderId } from '@renderer/shared/services/ai-providers'
import { cn } from '@renderer/shared/utils'
import { PROVIDER_VISUALS } from './provider-visuals'

type ProviderOrbProps = {
  providerId: ProviderId
  status: CheckStatus
  /** Whether the user is cleared to continue — surfaces the ready badge. */
  ready: boolean
}

/** The step's focal element + live status hub. A softly pulsing tile wears the
    active provider's icon + accent; the corner badge reports the probe state
    (detecting → ready → not found). Glow and icon are keyed by provider so they
    crossfade as the switch flips — the color story stays in one place. */
export function ProviderOrb({ providerId, status, ready }: ProviderOrbProps): React.JSX.Element {
  const { Icon, accent, glow, ring } = PROVIDER_VISUALS[providerId]
  const errored = status === 'error'

  // On a failed probe the orb cools down to a neutral/alert tone so it reads as
  // "needs attention" rather than a confident, lit-up selection.
  const tileAccent = errored ? 'var(--muted-foreground)' : accent
  const tileRing = errored ? 'var(--destructive)' : ring
  const tileGlow = errored ? 'oklch(0.6 0.02 285 / 0.25)' : glow

  return (
    <div className="relative grid size-24 place-items-center">
      <div
        key={`glow-${providerId}-${errored}`}
        aria-hidden
        className="animate-onb-glow pointer-events-none absolute inset-0 m-auto size-16 rounded-full"
        style={{
          background: `radial-gradient(circle, ${tileGlow}, transparent 70%)`,
          filter: 'blur(18px)'
        }}
      />

      <div
        className="relative grid size-[68px] place-items-center rounded-2xl border bg-card/90 backdrop-blur-sm transition-colors duration-300"
        style={{ borderColor: tileRing, boxShadow: 'var(--edge-soft)' }}
      >
        <Icon
          key={`icon-${providerId}-${errored}`}
          className="size-8 animate-in fade-in zoom-in-90 animation-duration-[280ms] [animation-timing-function:var(--ease-out)]"
          style={{ color: tileAccent }}
        />
      </div>

      {status === 'checking' ? (
        <Badge className="bg-muted text-muted-foreground">
          <LoaderCircle className="size-3 animate-spin" />
        </Badge>
      ) : errored ? (
        <Badge className="bg-destructive text-destructive-foreground">
          <X className="size-3" strokeWidth={3} />
        </Badge>
      ) : ready ? (
        <Badge className="bg-success text-success-foreground">
          <Check className="size-3" strokeWidth={3} />
        </Badge>
      ) : null}
    </div>
  )
}

function Badge({
  className,
  children
}: {
  className?: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <span
      aria-hidden
      className={cn(
        'absolute right-1 bottom-1 grid size-5 animate-in place-items-center rounded-full',
        'border-2 border-canvas zoom-in-50 animation-duration-[220ms] [animation-timing-function:var(--ease-snap)]',
        className
      )}
    >
      {children}
    </span>
  )
}
