import { useLingui } from '@lingui/react/macro'
import { Input } from '@renderer/shared/ui/input'

type GradeInputProps = {
  value: number | null
  max: number
  onChange: (score: number) => void
}

/** Compact essay score field: a number from 0 to the question's weight. */
export function GradeInput({ value, max, onChange }: GradeInputProps): React.JSX.Element {
  const { t } = useLingui()
  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        min={0}
        max={max}
        step={0.5}
        value={value ?? ''}
        placeholder="—"
        aria-label={t`Nota da questão`}
        className="h-9 w-20 text-center"
        onChange={(e) => {
          const raw = e.target.value
          if (raw === '') return
          const n = Number(raw)
          if (Number.isNaN(n)) return
          onChange(Math.max(0, Math.min(max, n)))
        }}
      />
      <span className="text-sm font-bold text-muted-foreground">/ {max}</span>
    </div>
  )
}
