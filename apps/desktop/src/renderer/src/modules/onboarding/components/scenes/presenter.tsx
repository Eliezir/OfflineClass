import { Trans } from '@lingui/react/macro'
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { cn } from '@renderer/shared/utils'
import { SlideTemplate, TocSlide } from './slide-template'
import type { SlideTheme } from './themes'

type ExpandedPresenterProps = {
  theme: SlideTheme
  /** Which slide is showing: 0 = title, 1 = table of contents. */
  slide: number
  /** Pulses the "next" control when the demo cursor clicks it. */
  nextActive: boolean
  /** Pulses the theme toggle when the demo cursor clicks it. */
  themeActive: boolean
}

/** The deck opened fullscreen — the slide fills the stage, with an on-slide
    theme toggle and paging controls, demonstrating a real interactive deck. */
export function ExpandedPresenter({
  theme,
  slide,
  nextActive,
  themeActive
}: ExpandedPresenterProps): React.JSX.Element {
  const ThemeIcon = theme.light ? Sun : Moon
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: theme.bg }}>
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-[450ms] [transition-timing-function:var(--ease-out)]',
          slide === 0 ? 'opacity-100' : 'opacity-0'
        )}
      >
        <SlideTemplate theme={theme} fill />
      </div>
      <div
        className={cn(
          'absolute inset-0 transition-opacity duration-[450ms] [transition-timing-function:var(--ease-out)]',
          slide === 1 ? 'opacity-100' : 'opacity-0'
        )}
      >
        <TocSlide theme={theme} fill />
      </div>

      {/* On-slide theme toggle — recolors the whole deck when triggered. */}
      <div className="absolute top-3 left-3">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-medium text-white ring-2 backdrop-blur-sm transition-all duration-200',
            themeActive ? 'scale-95 ring-white/70' : 'ring-white/10'
          )}
        >
          <ThemeIcon className="size-3.5" style={{ color: theme.accent }} />
          {theme.light ? <Trans>Light</Trans> : <Trans>Dark</Trans>}
        </span>
      </div>

      {/* Floating presenter controls — top-right is the "next" target. */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className="grid size-7 place-items-center rounded-full bg-black/30 text-white/50 backdrop-blur-sm">
          <ChevronLeft className="size-4" />
        </span>
        <span
          className={cn(
            'grid size-7 place-items-center rounded-full text-white shadow-md ring-2 transition-transform duration-150',
            nextActive ? 'scale-90 ring-white/60' : 'ring-transparent'
          )}
          style={{ background: theme.accent }}
        >
          <ChevronRight className="size-4" />
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
        {[0, 1].map((d) => (
          <span
            key={d}
            className="size-1.5 rounded-full transition-colors"
            style={{ background: d === slide ? theme.accent : 'oklch(1 0 0 / 0.3)' }}
          />
        ))}
      </div>
    </div>
  )
}
