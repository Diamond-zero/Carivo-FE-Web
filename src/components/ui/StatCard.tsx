import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'

type StatAccent =
  | 'brand'
  | 'indigo'
  | 'amber'
  | 'emerald'
  | 'violet'
  | 'rose'
  | 'red'

const accentStyles: Record<
  StatAccent,
  { icon: string; value: string; hint: string }
> = {
  brand: {
    icon: 'bg-brand-50 text-brand-700 ring-brand-100',
    value: 'text-slate-900',
    hint: 'text-slate-500',
  },
  indigo: {
    icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    value: 'text-slate-900',
    hint: 'text-slate-500',
  },
  amber: {
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    value: 'text-slate-900',
    hint: 'text-slate-500',
  },
  emerald: {
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    value: 'text-slate-900',
    hint: 'text-slate-500',
  },
  violet: {
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    value: 'text-slate-900',
    hint: 'text-slate-500',
  },
  rose: {
    icon: 'bg-rose-50 text-rose-700 ring-rose-100',
    value: 'text-slate-900',
    hint: 'text-slate-500',
  },
  red: {
    icon: 'bg-red-50 text-red-700 ring-red-100',
    value: 'text-slate-900',
    hint: 'text-slate-500',
  },
}

interface StatCardProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  accent?: StatAccent
  hint?: ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'brand',
  hint,
  className,
}: StatCardProps) {
  const styles = accentStyles[accent] ?? accentStyles.brand

  return (
    <div
      className={cn(
        'rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-slate-300',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={cn('text-xs font-medium uppercase tracking-wider', styles.hint)}>
          {label}
        </span>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1',
            styles.icon,
          )}
        >
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mt-2">
        <p
          className={cn(
            'text-[28px] font-bold leading-tight tracking-tight',
            styles.value,
          )}
        >
          {value}
        </p>
        {hint ? (
          <p className={cn('mt-1 text-xs', styles.hint)}>{hint}</p>
        ) : null}
      </div>
    </div>
  )
}
