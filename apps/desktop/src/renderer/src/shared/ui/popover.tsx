import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'

import { cn } from '@renderer/shared/utils'

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>): React.JSX.Element {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>): React.JSX.Element {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>): React.JSX.Element {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          /* Framer-style: translucent + blur + hairline border + inset highlight */
          'z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-2xl border border-border p-1.5',
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
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>): React.JSX.Element {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

/** A menu row inside a Popover — icon chip + title + optional caption. */
function PopoverItem({
  icon,
  title,
  caption,
  className,
  iconClassName,
  ...props
}: React.ComponentProps<'button'> & {
  icon?: React.ReactNode
  title: React.ReactNode
  caption?: React.ReactNode
  iconClassName?: string
}): React.JSX.Element {
  return (
    <button
      type="button"
      data-slot="popover-item"
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left',
        'transition-colors duration-150 hover:bg-muted focus-visible:bg-muted',
        'outline-none',
        className
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground',
            'shadow-[var(--edge-soft)]',
            iconClassName
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
        {caption && (
          <span className="truncate text-xs text-muted-foreground">{caption}</span>
        )}
      </span>
    </button>
  )
}

function PopoverSeparator({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="popover-separator"
      role="separator"
      className={cn('my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

function PopoverHeader({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-0.5 px-2.5 pb-2 pt-1.5', className)}
      {...props}
    />
  )
}

function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<'div'>): React.JSX.Element {
  return (
    <div
      data-slot="popover-title"
      className={cn('text-sm font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<'p'>): React.JSX.Element {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverItem,
  PopoverSeparator,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription
}
