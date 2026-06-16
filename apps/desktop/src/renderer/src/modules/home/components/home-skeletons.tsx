import { Skeleton } from '@renderer/shared/ui/skeleton'

/** Loading placeholders that mirror the real home cards/rows. */

export function StatCardSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
      <Skeleton className="size-11 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-12" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

export function ProvaCardSkeleton(): React.JSX.Element {
  return (
    <div className="flex h-full flex-col gap-2.5 rounded-xl border border-border bg-card p-3.5">
      <div className="flex items-start justify-between">
        <Skeleton className="size-9 rounded-[10px]" />
        <Skeleton className="size-8 rounded-[10px]" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3.5 w-full" />
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="mt-1 h-3 w-1/2" />
      </div>
    </div>
  )
}

export function ResultRowSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 py-2.5 last:border-0">
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/3" />
      </div>
      <Skeleton className="h-6 w-10 rounded-full" />
    </div>
  )
}
