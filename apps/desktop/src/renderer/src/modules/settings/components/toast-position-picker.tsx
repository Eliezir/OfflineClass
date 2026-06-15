import { useState } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import type { MessageDescriptor } from '@lingui/core'
import { useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import type { ToastPosition } from '../hooks/use-notification-settings'
import { TOAST_TONES, type ToastTone } from '../toast-tones'

/** macOS draws traffic lights on the left; Windows/Linux draw min/max/close on
    the right — so the demo window matches the user's real OS chrome. Falls back
    to the browser's platform hint when not running inside Electron (dev:web). */
function isMacChrome(): boolean {
  if (typeof window !== 'undefined' && window.electron) {
    return window.electron.process.platform === 'darwin'
  }
  if (typeof navigator !== 'undefined') {
    return /mac/i.test(navigator.platform || navigator.userAgent)
  }
  return true
}

const ANCHORS: { value: ToastPosition; label: MessageDescriptor; x: number; y: number }[] = [
  { value: 'top-left', label: msg`Superior esquerda`, x: 0, y: 0 },
  { value: 'top-center', label: msg`Superior centro`, x: 0.5, y: 0 },
  { value: 'top-right', label: msg`Superior direita`, x: 1, y: 0 },
  { value: 'center-left', label: msg`Centro esquerda`, x: 0, y: 0.5 },
  { value: 'center-right', label: msg`Centro direita`, x: 1, y: 0.5 },
  { value: 'bottom-left', label: msg`Inferior esquerda`, x: 0, y: 1 },
  { value: 'bottom-center', label: msg`Inferior centro`, x: 0.5, y: 1 },
  { value: 'bottom-right', label: msg`Inferior direita`, x: 1, y: 1 }
]

/** Anchor an element to a fractional point of its container, pulling it back by
    its own size so corners sit flush (x/y of 0 → 1). */
function anchorStyle(x: number, y: number): React.CSSProperties {
  return {
    left: `${x * 100}%`,
    top: `${y * 100}%`,
    transform: `translate(${-x * 100}%, ${-y * 100}%)`
  }
}

type ToastPositionPickerProps = {
  value: ToastPosition
  onChange: (position: ToastPosition) => void
  /** Bump to replay the toast's entrance animation (the test buttons). */
  replaySignal?: number
  /** Tone of the sample toast — set by the "Testar" type buttons. */
  tone?: ToastTone
}

/** A mini app screen. The real toast sits at the selected spot; hovering a dot
    shows a gray preview there (the real one stays put). The dot at the
    active/previewed spot fades out as its toast takes over. */
export function ToastPositionPicker({
  value,
  onChange,
  replaySignal = 0,
  tone
}: ToastPositionPickerProps): React.JSX.Element {
  const { i18n, t } = useLingui()
  const toneVisual = tone ? TOAST_TONES.find((tv) => tv.id === tone) : undefined
  const ToneIcon = toneVisual?.icon
  const [hovered, setHovered] = useState<ToastPosition | null>(null)
  const selected = ANCHORS.find((a) => a.value === value) ?? ANCHORS[0]
  const previewPos = hovered && hovered !== value ? ANCHORS.find((a) => a.value === hovered) : null

  return (
    <div
      className="overflow-hidden rounded-md border border-border bg-card"
      onMouseLeave={() => setHovered(null)}
    >
      {/* window chrome — macOS traffic lights (left) or Windows controls (right) */}
      <div className="flex h-7 items-center border-b border-border/70 bg-muted/40 px-3">
        {isMacChrome() ? (
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
          </div>
        ) : (
          <div className="ml-auto flex items-center gap-3 text-foreground/25">
            <Minus className="size-3" />
            <Square className="size-2.5" />
            <X className="size-3" />
          </div>
        )}
      </div>

      <div role="radiogroup" aria-label={t`Posição do toast`} className="relative aspect-[16/10]">
        <div className="absolute inset-3">
          {ANCHORS.map((a) => {
            const hide = a.value === value || a.value === hovered
            return (
              <button
                key={a.value}
                type="button"
                role="radio"
                aria-checked={a.value === value}
                aria-label={i18n._(a.label)}
                title={i18n._(a.label)}
                onMouseEnter={() => setHovered(a.value)}
                onFocus={() => setHovered(a.value)}
                onClick={() => onChange(a.value)}
                className="group absolute z-20 grid size-6 cursor-pointer place-items-center rounded-md outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25"
                style={anchorStyle(a.x, a.y)}
              >
                <span
                  className={cn(
                    'size-2 rounded-full bg-muted-foreground/40 transition-opacity duration-200 [transition-timing-function:var(--ease-out)] group-hover:bg-muted-foreground/70',
                    hide && 'opacity-0'
                  )}
                />
              </button>
            )
          })}

          {/* gray preview — anchored by the outer div; the inner only fades, so
              it appears in place with no movement. */}
          {previewPos && (
            <div
              key={previewPos.value}
              aria-hidden
              className="pointer-events-none absolute z-10"
              style={anchorStyle(previewPos.x, previewPos.y)}
            >
              <div className="flex w-24 animate-in items-center gap-1.5 rounded-md border border-dashed border-muted-foreground/40 bg-muted/60 px-2 py-1.5 fade-in duration-200 [animation-timing-function:var(--ease-out)]">
                <span className="size-2 shrink-0 rounded-full bg-muted-foreground/40" />
                <span className="flex-1 space-y-1">
                  <span className="block h-1 w-3/4 rounded-full bg-muted-foreground/30" />
                  <span className="block h-1 w-1/2 rounded-full bg-muted-foreground/20" />
                </span>
              </div>
            </div>
          )}

          {/* the real toast — outer glides to the selected spot on click; inner
              fades in (re-keyed on a test). Splitting position from the fade
              keeps animate-in from fighting the anchor transform. */}
          <div
            aria-hidden
            className="pointer-events-none absolute z-10 transition-[left,top,transform] duration-300 [transition-timing-function:var(--ease-snap)]"
            style={anchorStyle(selected.x, selected.y)}
          >
            <div
              key={replaySignal}
              className="flex w-24 animate-in items-center gap-1.5 rounded-md border border-primary/40 bg-card px-2 py-1.5 fade-in shadow-md ring-1 ring-primary/20 animation-duration-[260ms] [animation-timing-function:var(--ease-out)]"
            >
              {ToneIcon ? (
                <ToneIcon
                  className={cn('size-3 shrink-0', toneVisual?.className)}
                  strokeWidth={2.5}
                />
              ) : (
                <span className="size-2 shrink-0 rounded-full bg-primary" />
              )}
              <span className="flex-1 space-y-1">
                <span className="block h-1 w-3/4 rounded-full bg-foreground/40" />
                <span className="block h-1 w-1/2 rounded-full bg-foreground/20" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
