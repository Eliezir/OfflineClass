import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-bold tracking-tight',
    'transition-[background-color,color,box-shadow,opacity,transform,filter] duration-150 [transition-timing-function:var(--ease-out)]',
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/35',
    'disabled:pointer-events-none disabled:opacity-50 select-none',
    'aria-invalid:ring-[3px] aria-invalid:ring-destructive/30',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
  ].join(' '),
  {
    variants: {
      variant: {
        /* Primary — chunky 3D pressable: solid indigo with darker bottom edge
           that compresses on press (Duolingo-style). */
        default:
          'rounded-[14px] bg-primary text-primary-foreground shadow-[0_4px_0_var(--primary-dark)] hover:brightness-[1.04] active:translate-y-[2px] active:shadow-[0_1px_0_var(--primary-dark)]',
        /* Secondary — neutral surface, pressable edge */
        secondary:
          'rounded-[14px] bg-card text-foreground border border-border shadow-[0_4px_0_var(--input-border)] hover:bg-muted active:translate-y-[2px] active:shadow-[0_1px_0_var(--input-border)]',
        /* Destructive — solid red, flat */
        destructive:
          'rounded-[14px] bg-destructive text-destructive-foreground hover:bg-destructive/90',
        /* Outline — neutral border + pressable edge */
        outline:
          'rounded-[14px] bg-card text-foreground border border-border shadow-[0_4px_0_var(--input-border)] hover:bg-muted active:translate-y-[2px] active:shadow-[0_1px_0_var(--input-border)]',
        /* Ghost — no chrome until hover. Used for back/cancel/icon buttons. */
        ghost: 'rounded-[14px] hover:bg-muted hover:text-foreground',
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
