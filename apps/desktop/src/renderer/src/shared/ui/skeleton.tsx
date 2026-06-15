import { cn } from '@renderer/shared/utils'

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>): React.JSX.Element {
  return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />
}
