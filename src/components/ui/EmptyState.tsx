import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'px-4 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 text-slate-400 ring-1 ring-slate-200/80',
          compact ? 'mb-3 h-12 w-12' : 'mb-4 h-16 w-16',
        )}
      >
        <Icon className={compact ? 'h-6 w-6' : 'h-7 w-7'} />
      </div>
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-slate-500">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
