import * as React from 'react'
import { Switch as SwitchPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>): React.JSX.Element {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border border-transparent',
        'bg-input-border transition-colors outline-none',
        'focus-visible:ring-[3px] focus-visible:ring-ring/30',
        'data-[state=checked]:bg-primary',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          'pointer-events-none block size-5 rounded-full bg-white shadow-sm ring-0',
          'transition-transform translate-x-0.5 data-[state=checked]:translate-x-[1.375rem]'
        )}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
