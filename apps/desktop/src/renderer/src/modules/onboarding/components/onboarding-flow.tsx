import { useState } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import { useNavigate } from '@tanstack/react-router'
import { Button } from '@renderer/shared/ui/button'
import { cn } from '@renderer/shared/utils'
import { useTheme } from '@renderer/shared/hooks/use-theme'
import { WindowControls } from '@renderer/shared/layouts/window-controls'
import { markOnboardingComplete } from '../hooks/onboarding-storage'
import { useProviderSetup } from '@renderer/shared/services/ai-providers'
import { Hero } from './hero'
import { HowItWorks } from './how-it-works'
import { ProgressDots } from './progress-dots'
import { SetupSlide } from './setup-slide'
import { SpaceBackdrop } from './space-backdrop'

const TOTAL = 3

export function OnboardingFlow(): React.JSX.Element {
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const navigate = useNavigate()
  const setup = useProviderSetup()
  // Onboarding lives outside the _app shell, so it owns applying the theme.
  const { isDark } = useTheme()

  const isHero = index === 0
  const isSetup = index === 2
  const isLast = index === TOTAL - 1

  const go = (next: number): void => {
    if (next < 0 || next >= TOTAL || next === index) return
    setDirection(next > index ? 1 : -1)
    setIndex(next)
  }

  const finish = (): void => {
    markOnboardingComplete()
    void navigate({ to: '/home' })
  }

  const complete = async (): Promise<void> => {
    // Only enter the app once the choice is saved; a failed save re-enables the
    // button so the user can retry instead of getting stuck.
    if (await setup.submit()) finish()
  }

  const enterClass = direction === 1 ? 'slide-in-from-right-6' : 'slide-in-from-left-6'

  return (
    <div className="relative isolate flex h-screen flex-col overflow-hidden bg-canvas text-foreground">
      <SpaceBackdrop />

      {/* Draggable top bar. Onboarding lives outside the _app shell, so it owns
          its own window-drag region (move + double-click to maximize) and the
          min/max/close controls for frameless Windows/Linux (null on macOS —
          traffic lights handle it). It also balances the fixed footer so slides
          stay vertically centered. */}
      <header
        className="flex h-14 shrink-0 items-center justify-end px-3"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <WindowControls />
      </header>

      <div className="scrollbar-subtle flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto px-6">
        <div
          key={index}
          className={cn(
            'flex min-h-full w-full flex-col py-6 animate-in fade-in animation-duration-[420ms] [animation-timing-function:var(--ease-out)]',
            enterClass
          )}
        >
          {/* Auto margins center the slide when it fits, but stay scrollable —
              unlike justify/items-center, which clips (and hides) the top of a
              slide taller than the viewport (e.g. the step icons on step 2). */}
          <div className="m-auto flex w-full flex-col items-center">
            {isHero ? (
              <Hero isDark={isDark} onStart={() => go(1)} />
            ) : isSetup ? (
              <SetupSlide setup={setup} />
            ) : (
              <HowItWorks />
            )}
          </div>
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-4 px-8 pb-10">
        <div className="flex flex-1 justify-start">
          {index > 0 && (
            <Button variant="ghost" size="sm" onClick={() => go(index - 1)}>
              <ArrowLeft />
              <Trans>Voltar</Trans>
            </Button>
          )}
        </div>

        <ProgressDots count={TOTAL} active={index} onSelect={go} />

        <div className="flex flex-1 justify-end">
          {/* The hero owns its own "Começar" CTA, so the footer stays empty there. */}
          {isHero ? null : isLast ? (
            <Button
              size="sm"
              disabled={!setup.canContinue || setup.isSubmitting}
              onClick={() => void complete()}
            >
              <Trans>Entrar no app</Trans>
              <ArrowRight />
            </Button>
          ) : (
            <Button size="sm" onClick={() => go(index + 1)}>
              <Trans>Continuar</Trans>
              <ArrowRight />
            </Button>
          )}
        </div>
      </footer>
    </div>
  )
}
