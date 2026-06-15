import { MessagesSquare, Pause, PenLine, Play, Presentation } from 'lucide-react'
import { msg } from '@lingui/core/macro'
import { Trans, useLingui } from '@lingui/react/macro'
import type { MessageDescriptor } from '@lingui/core'
import { cn } from '@renderer/shared/utils'
import { useProgressCycle } from '../hooks/use-progress-cycle'
import { DemoFrame } from './scenes/editor-chrome'
import { GenerateScene } from './scenes/generate-scene'
import { ScriptScene } from './scenes/script-scene'
import { WriteScene } from './scenes/write-scene'

type Feature = {
  title: MessageDescriptor
  body: MessageDescriptor
  file: string
  Icon: typeof PenLine
  Scene: typeof WriteScene
}

const FEATURES: Feature[] = [
  {
    title: msg`Escreva do seu jeito`,
    body: msg`Cole anotações, um texto corrido ou tópicos soltos — a IA entende e organiza em um roteiro.`,
    file: 'rascunho.md',
    Icon: PenLine,
    Scene: WriteScene
  },
  {
    title: msg`A IA vira roteiro`,
    body: msg`Refine conversando: peça mais exemplos, transforme parágrafos em tópicos, ajuste o tom.`,
    file: 'roteiro.md',
    Icon: MessagesSquare,
    Scene: ScriptScene
  },
  {
    title: msg`Vira apresentação de verdade`,
    body: msg`Escolha um modelo visual e gere uma apresentação em HTML real, com transições e interação.`,
    file: 'apollo-11 · apresentação',
    Icon: Presentation,
    Scene: GenerateScene
  }
]

// Stable identities for the rAF cycle (per-feature duration + hold, in ms).
const DURATIONS = [10000, 9000, 13000]
const HOLD = [2200, 2200, 2600]

export function HowItWorks(): React.JSX.Element {
  const { i18n } = useLingui()
  const { index, progress, playing, reduced, togglePlaying, goTo } = useProgressCycle(
    DURATIONS,
    HOLD
  )
  const total = FEATURES.length
  const active = FEATURES[index]
  const ActiveScene = active.Scene

  return (
    <div className="mx-auto w-full max-w-[860px]">
      <div className="mb-3 text-center font-mono text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
        <Trans>Como funciona</Trans>
      </div>

      {/* Step icons — differentiate each stage at a glance. */}
      <div className="mb-4 flex items-center justify-center gap-2">
        {FEATURES.map((f, i) => {
          const StepIcon = f.Icon
          const stepTitle = i18n._(f.title)
          return (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={stepTitle}
              title={stepTitle}
              className={cn(
                'grid size-9 place-items-center rounded-lg border transition-all duration-300',
                i === index
                  ? 'border-primary/40 bg-primary-soft text-primary'
                  : 'border-border text-muted-foreground hover:bg-foreground/[0.04]'
              )}
            >
              <StepIcon className="size-4" />
            </button>
          )
        })}
      </div>

      {/* One persistent app window; only the active stage renders — no transition. */}
      <DemoFrame file={active.file}>
        <ActiveScene progress={progress} />
      </DemoFrame>

      <div key={index} className="mt-5 min-h-[82px] animate-in fade-in animation-duration-[400ms]">
        <div className="font-mono text-[11px] font-bold tracking-wider text-primary uppercase">
          {String(index + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
        <h2 className="mt-1.5 font-display text-xl font-bold tracking-tight">
          {i18n._(active.title)}
        </h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">
          {i18n._(active.body)}
        </p>
      </div>

      {!reduced && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={togglePlaying}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
          >
            {playing ? <Pause className="size-3" /> : <Play className="size-3" />}
            {playing ? <Trans>Pausar</Trans> : <Trans>Reproduzir</Trans>}
          </button>
        </div>
      )}
    </div>
  )
}
