import { ArrowRight } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import logo from '@renderer/shared/assets/logo-icon.png'
import { Button } from '@renderer/shared/ui/button'

type HeroProps = {
  onStart: () => void
}

export function Hero({ onStart }: HeroProps): React.JSX.Element {
  return (
    <div className="relative flex flex-col items-center gap-7 text-center">
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className="animate-onb-glow pointer-events-none absolute inset-0 m-auto size-44 rounded-full"
          style={{
            background: 'radial-gradient(circle, oklch(0.58 0.19 270 / 0.45), transparent 70%)',
            filter: 'blur(30px)',
            opacity: 0.8
          }}
        />
        <img
          src={logo}
          alt="OfflineClass"
          className="relative size-28 animate-in fade-in zoom-in-95 drop-shadow-sm animation-duration-[600ms] fill-mode-[backwards] [animation-timing-function:var(--ease-out)]"
        />
      </div>

      <h1 className="animate-in fade-in slide-in-from-bottom-2 font-display text-5xl font-bold tracking-tight animation-duration-[500ms] [animation-delay:120ms] fill-mode-[backwards]">
        Offline<span className="text-primary">Class</span>
      </h1>

      <p className="max-w-sm animate-in fade-in text-base text-pretty text-muted-foreground animation-duration-[400ms] [animation-delay:280ms] fill-mode-[backwards]">
        <Trans>Avaliações sem internet, sincronizadas na sua rede local.</Trans>
      </p>

      <Button
        size="lg"
        onClick={onStart}
        className="mt-2 animate-in fade-in animation-duration-[400ms] [animation-delay:440ms] fill-mode-[backwards]"
      >
        <Trans>Começar</Trans>
        <ArrowRight />
      </Button>
    </div>
  )
}
