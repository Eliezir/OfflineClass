import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

function Popover({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = 'center',
  sideOffset = 8,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          'z-50 w-72 origin-(--radix-popover-content-transform-origin) rounded-2xl border border-border p-1.5',
          'bg-popover/85 text-popover-foreground backdrop-blur-xl saturate-150',
          'shadow-[var(--edge-soft),0_1px_2px_rgb(0_0_0_/_0.06),0_20px_40px_-12px_rgb(0_0_0_/_0.18)]',
          'outline-hidden',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-header"
      className={cn('flex flex-col gap-0.5 px-2.5 pb-2 pt-1.5', className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-title"
      className={cn('text-sm font-semibold text-foreground', className)}
      {...props}
    />
  )
}

function PopoverDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return (
    <p
      data-slot="popover-description"
      className={cn('text-xs text-muted-foreground', className)}
      {...props}
    />
  )
}

function PopoverItem({
  icon,
  title,
  caption,
  className,
  iconClassName,
  ...props
}: Omit<React.ComponentProps<'button'>, 'title'> & {
  icon?: React.ReactNode
  title: React.ReactNode
  caption?: React.ReactNode
  iconClassName?: string
}) {
  return (
    <button
      type="button"
      data-slot="popover-item"
      className={cn(
        'group flex w-full cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 text-left outline-none',
        className
      )}
      {...props}
    >
      {icon && (
        <span
          className={cn(
            'grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-foreground',
            'shadow-(--edge-soft)',
            'transition-[background-color,color] duration-300 ease-out',
            'group-hover:bg-primary-soft group-hover:text-primary-soft-foreground',
            'group-focus-visible:bg-primary-soft group-focus-visible:text-primary-soft-foreground',
            iconClassName
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium text-foreground">{title}</span>
        {caption && <span className="truncate text-xs text-muted-foreground">{caption}</span>}
      </span>
    </button>
  )
}

function PopoverSeparator({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="popover-separator"
      role="separator"
      className={cn('my-1 h-px bg-border', className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverItem,
  PopoverSeparator
}
