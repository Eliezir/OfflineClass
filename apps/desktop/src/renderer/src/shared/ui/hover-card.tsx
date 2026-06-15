import * as React from 'react'
import { HoverCard as HoverCardPrimitive } from 'radix-ui'

import { cn } from '@renderer/shared/utils'

function HoverCard({
  openDelay = 120,
  closeDelay = 80,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Root>): React.JSX.Element {
  return (
    <HoverCardPrimitive.Root
      data-slot="hover-card"
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function HoverCardTrigger({
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Trigger>): React.JSX.Element {
  return <HoverCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
}

function HoverCardContent({
  className,
  align = 'center',
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof HoverCardPrimitive.Content>): React.JSX.Element {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        data-slot="hover-card-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          /* matches PopoverContent: translucent + blur + hairline border */
          'z-50 w-72 origin-(--radix-hover-card-content-transform-origin) rounded-2xl border border-border p-1.5',
          'bg-popover/85 text-popover-foreground backdrop-blur-xl saturate-150',
          'shadow-[var(--edge-soft),0_1px_2px_rgb(0_0_0_/_0.06),0_20px_40px_-12px_rgb(0_0_0_/_0.18)]',
          'outline-hidden',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
