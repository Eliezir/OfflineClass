import * as React from 'react'

import { cn } from '@renderer/shared/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>): React.JSX.Element {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-20 w-full min-w-0 rounded-[14px] border border-input-border bg-input px-3 py-2 text-sm',
        'placeholder:text-muted-foreground field-sizing-content',
        'shadow-[var(--edge-soft)] transition-[box-shadow,border-color] duration-150 outline-none',
        'selection:bg-primary selection:text-primary-foreground',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/25',
        'aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/25',
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
