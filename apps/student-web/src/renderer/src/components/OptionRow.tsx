import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface OptionRowProps {
  /** 'single' → radio (round); 'multi' → checkbox (square). */
  variant: 'single' | 'multi'
  checked: boolean
  onToggle: () => void
  children: React.ReactNode
}

/** A full-width tappable answer option. The whole row is the hit target
    (large touch area for mobile + accessibility); selected state is shown with
    a filled control, primary border and a tinted surface. */
export function OptionRow({
  variant,
  checked,
  onToggle,
  children
}: OptionRowProps): React.JSX.Element {
  return (
    <button
      type="button"
      role={variant === 'single' ? 'radio' : 'checkbox'}
      aria-checked={checked}
      onClick={onToggle}
      className={cn(
        'group flex w-full items-center gap-3 rounded-[12px] border px-3.5 text-left',
        'min-h-13 py-2.5 text-[0.95em] font-semibold outline-none transition-[color,background-color,border-color,transform] duration-150',
        'focus-visible:ring-[3px] focus-visible:ring-ring/30 active:scale-[0.99]',
        checked
          ? 'border-primary bg-primary-soft text-primary-soft-foreground'
          : 'border-input-border bg-card text-foreground hover:bg-muted/50'
      )}
    >
      <span
        aria-hidden
        className={cn(
          'grid size-[22px] shrink-0 place-items-center border-2 transition-colors duration-150',
          variant === 'single' ? 'rounded-full' : 'rounded-[7px]',
          checked ? 'border-primary bg-primary text-primary-foreground' : 'border-input-border'
        )}
      >
        {checked &&
          (variant === 'single' ? (
            <span className="size-2.5 rounded-full bg-primary-foreground" />
          ) : (
            <Check className="size-3.5" strokeWidth={3.5} />
          ))}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  )
}
