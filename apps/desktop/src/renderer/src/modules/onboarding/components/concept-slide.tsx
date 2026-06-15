import { Trans, useLingui } from '@lingui/react/macro'
import { cn } from '@renderer/shared/utils'
import type { OnboardingStep, Tone } from '../steps'

/** Solid accent tile per tone. Listed as literal classes so Tailwind keeps them. */
const TILE: Record<Tone, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  tertiary: 'bg-tertiary text-tertiary-foreground',
  quaternary: 'bg-quaternary text-quaternary-foreground'
}

type ConceptSlideProps = {
  step: OnboardingStep
  /** 1-based position among the content steps. */
  index: number
  total: number
}

export function ConceptSlide({ step, index, total }: ConceptSlideProps): React.JSX.Element {
  const { i18n } = useLingui()
  const { Icon, tone } = step

  return (
    <div className="flex max-w-md flex-col items-center gap-5 text-center">
      <div className={cn('grid size-16 place-items-center rounded-[18px] shadow-sm', TILE[tone])}>
        <Icon className="size-7" />
      </div>
      <div className="font-mono text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
        <Trans>
          Passo {index} de {total}
        </Trans>
      </div>
      <h2 className="font-display text-2xl font-bold tracking-tight">{i18n._(step.title)}</h2>
      <p className="max-w-sm text-base text-pretty text-muted-foreground">{i18n._(step.body)}</p>
    </div>
  )
}
