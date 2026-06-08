import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/utils'
import { Card, CardContent } from './Card'

type StatAccent = 'brand' | 'indigo' | 'amber' | 'emerald' | 'violet'

const accentStyles: Record<
  StatAccent,
  { bar: string; icon: string; value: string }
> = {
  brand: {
    bar: 'bg-brand-500',
    icon: 'bg-brand-50 text-brand-700 ring-brand-100',
    value: 'text-slate-900',
  },
  indigo: {
    bar: 'bg-indigo-500',
    icon: 'bg-indigo-50 text-indigo-700 ring-indigo-100',
    value: 'text-slate-900',
  },
  amber: {
    bar: 'bg-amber-500',
    icon: 'bg-amber-50 text-amber-700 ring-amber-100',
    value: 'text-slate-900',
  },
  emerald: {
    bar: 'bg-emerald-500',
    icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    value: 'text-slate-900',
  },
  violet: {
    bar: 'bg-violet-500',
    icon: 'bg-violet-50 text-violet-700 ring-violet-100',
    value: 'text-slate-900',
  },
}

interface StatCardProps {
  label: string
  value: ReactNode
  icon: LucideIcon
  accent?: StatAccent
  className?: string
}

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'brand',
  className,
}: StatCardProps) {
  const styles = accentStyles[accent]

  return (
    <Card className={cn('relative', className)}>
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-2xl', styles.bar)} />
      <CardContent className="flex items-start justify-between gap-4 py-5 pl-7">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={cn('mt-2 text-3xl font-bold tracking-tight', styles.value)}>
            {value}
          </p>
        </div>
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1',
            styles.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  )
}
