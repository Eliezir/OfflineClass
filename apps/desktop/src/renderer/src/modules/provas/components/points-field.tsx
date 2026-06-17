import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { Trans } from '@lingui/react/macro'

type PointsFieldProps = {
  /** Current points value. */
  value: number
  /** Called with the committed value (on blur or step). */
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
}

const round = (n: number): number => Math.round(n * 100) / 100

/** Compact stepper for a question's point weight: − [value] + with a "pts" label. */
export function PointsField({
  value,
  onChange,
  step = 0.5,
  min = 0.5,
  max = 1000
}: PointsFieldProps): React.JSX.Element {
  const [text, setText] = useState(String(value))

  const commit = (raw: string): void => {
    const parsed = Number.parseFloat(raw)
    const next = Number.isFinite(parsed) ? Math.min(max, Math.max(min, round(parsed))) : value
    setText(String(next))
    onChange(next)
  }

  const stepBy = (delta: number): void => {
    const base = Number.parseFloat(text)
    const current = Number.isFinite(base) ? base : value
    const next = Math.min(max, Math.max(min, round(current + delta)))
    setText(String(next))
    onChange(next)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-muted-foreground">
        <Trans>Pontos</Trans>
      </span>
      <div className="inline-flex h-9 items-center rounded-[10px] border border-input-border bg-input shadow-[var(--edge-soft)]">
        <button
          type="button"
          aria-label="−"
          onClick={() => stepBy(-step)}
          disabled={value <= min}
          className="grid h-full w-8 place-items-center rounded-l-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"
        >
          <Minus />
        </button>
        <input
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          className="h-full w-12 border-x border-input-border bg-transparent text-center text-sm font-semibold outline-none"
        />
        <button
          type="button"
          aria-label="+"
          onClick={() => stepBy(step)}
          disabled={value >= max}
          className="grid h-full w-8 place-items-center rounded-r-[10px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4"
        >
          <Plus />
        </button>
      </div>
    </div>
  )
}
