import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@renderer/shared/utils'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium tracking-tight',
    'transition-[background-color,color,box-shadow,opacity] duration-150 [transition-timing-function:var(--ease-out)]',
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35',
    'disabled:pointer-events-none disabled:opacity-50',
    'aria-invalid:ring-[3px] aria-invalid:ring-destructive/30',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ].join(' '),
  {
    variants: {
      variant: {
        /* Primary — solid violet, flat. Hover lightens. */
        default: 'rounded-[10px] bg-primary text-primary-foreground hover:bg-primary/90',
        /* Secondary — neutral surface with hairline border */
        secondary:
          'rounded-[10px] bg-card text-foreground border border-border hover:bg-muted',
        /* Destructive — solid red, flat */
        destructive:
          'rounded-[10px] bg-destructive text-destructive-foreground hover:bg-destructive/90',
        /* Outline — same as secondary, kept for shadcn parity */
        outline:
          'rounded-[10px] bg-card text-foreground border border-border hover:bg-muted',
        /* Ghost — no chrome until hover */
        ghost: 'rounded-[10px] hover:bg-muted hover:text-foreground',
        /* Link */
        link: 'text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-3.5 text-sm has-[>svg]:px-3',
        xs: 'h-7 gap-1 px-2.5 text-xs has-[>svg]:px-2 [&_svg:not([class*="size-"])]:size-3',
        sm: 'h-8 gap-1.5 px-3 text-sm has-[>svg]:px-2.5',
        lg: 'h-11 px-5 text-base has-[>svg]:px-4',
        icon: 'size-9',
        'icon-xs': 'size-7',
        'icon-sm': 'size-8',
        'icon-lg': 'size-11'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }): React.JSX.Element {
  const Comp = asChild ? Slot.Root : 'button'

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
