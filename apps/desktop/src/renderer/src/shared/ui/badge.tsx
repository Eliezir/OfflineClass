import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@renderer/shared/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide whitespace-nowrap transition-colors [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'bg-primary-soft text-primary',
        secondary: 'bg-muted text-muted-foreground',
        outline: 'border border-border text-foreground'
      }
    },
    defaultVariants: { variant: 'default' }
  }
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>): React.JSX.Element {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
