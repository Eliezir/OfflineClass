import { ArrowRight } from 'lucide-react'
import { Trans } from '@lingui/react/macro'
import logoDark from '@renderer/shared/assets/logo-dark.png'
import logoLight from '@renderer/shared/assets/logo-light.png'
import { Button } from '@renderer/shared/ui/button'

type HeroProps = {
  isDark: boolean
  onStart: () => void
}

export function Hero({ isDark, onStart }: HeroProps): React.JSX.Element {
  return (
    <div className="relative flex flex-col items-center gap-7 text-center">
      <div className="relative flex items-center justify-center">
        <div
          aria-hidden
          className="animate-onb-glow pointer-events-none absolute inset-0 m-auto size-44 rounded-full"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.24 295 / 0.5), transparent 70%)',
            filter: 'blur(30px)',
            opacity: 0.8
          }}
        />
        <img
          src={isDark ? logoDark : logoLight}
          alt="Apresenta.AI"
          className="relative size-28 animate-in fade-in zoom-in-95 drop-shadow-sm animation-duration-[600ms] fill-mode-[backwards] [animation-timing-function:var(--ease-out)]"
        />
      </div>

      <h1 className="animate-in fade-in slide-in-from-bottom-2 font-display text-5xl font-bold tracking-tight animation-duration-[500ms] [animation-delay:120ms] fill-mode-[backwards]">
        Apresenta
        <span
          className="onb-shimmer bg-clip-text text-transparent"
          style={{ backgroundImage: 'var(--gradient-ai)' }}
        >
          .AI
        </span>
      </h1>

      <p className="max-w-sm animate-in fade-in text-base text-pretty text-muted-foreground animation-duration-[400ms] [animation-delay:280ms] fill-mode-[backwards]">
        <Trans>Do texto à apresentação interativa em HTML, gerada por IA.</Trans>
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
