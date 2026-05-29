import * as React from 'react'

import { cn } from '@renderer/shared/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>): React.JSX.Element {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-9 w-full min-w-0 rounded-[10px] border border-input-border bg-input px-3 py-1 text-sm',
        'placeholder:text-muted-foreground',
        'shadow-[var(--edge-soft)] transition-[box-shadow,border-color] duration-150 outline-none',
        'selection:bg-primary selection:text-primary-foreground',
        'file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
        'aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25',
        className
      )}
      {...props}
    />
  )
}

export { Input }
