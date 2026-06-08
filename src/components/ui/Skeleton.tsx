import { cn } from '../../lib/utils'

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-gradient-to-r from-slate-200/80 via-slate-100/90 to-slate-200/80',
        className,
      )}
      aria-hidden
    />
  )
}

export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('h-4', index === lines - 1 ? 'w-2/3' : 'w-full')}
        />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="carivo-panel relative overflow-hidden p-5 pl-7">
      <Skeleton className="absolute inset-y-0 left-0 w-1 rounded-l-2xl" />
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  )
}

export function TableRowsSkeleton({
  rows = 5,
  columns = 6,
}: {
  rows?: number
  columns?: number
}) {
  return (
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200/80 bg-white shadow-[var(--shadow-carivo-sm)]">
      <div className="hidden bg-slate-50/90 px-4 py-3.5 sm:block">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={index} className="h-3 w-20" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              className={cn(
                'h-4',
                colIndex === 0
                  ? 'w-16'
                  : colIndex === columns - 1
                    ? 'w-20'
                    : 'w-full max-w-[120px]',
              )}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
      <div className="carivo-panel p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
      <div className="carivo-panel p-6">
        <Skeleton className="mb-4 h-5 w-36" />
        <TableRowsSkeleton rows={4} columns={6} />
      </div>
    </div>
  )
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="h-11 w-32 rounded-xl" />
    </div>
  )
}
