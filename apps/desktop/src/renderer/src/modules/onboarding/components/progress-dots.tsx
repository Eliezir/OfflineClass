import { cn } from '@renderer/shared/utils'

type ProgressDotsProps = {
  count: number
  active: number
  onSelect?: (index: number) => void
}

export function ProgressDots({ count, active, onSelect }: ProgressDotsProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: count }, (_, i) => {
        const isActive = i === active
        return (
          <button
            key={i}
            type="button"
            aria-label={`Ir para o passo ${i + 1}`}
            aria-current={isActive || undefined}
            onClick={() => onSelect?.(i)}
            className={cn(
              'h-1.5 rounded-full outline-none transition-all duration-300 [transition-timing-function:var(--ease-out)]',
              'focus-visible:ring-[3px] focus-visible:ring-ring/25',
              isActive ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/20 hover:bg-foreground/35'
            )}
          />
        )
      })}
    </div>
  )
}
