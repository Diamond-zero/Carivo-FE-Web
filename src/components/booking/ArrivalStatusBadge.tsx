import { cn } from '../../lib/utils'
import type { ApiBookingArrivalStatus } from '../../types/api/staff'

const ARRIVAL_LABELS: Record<string, string> = {
  EARLY: 'Đến sớm',
  ON_TIME: 'Đúng giờ',
  LATE: 'Đến muộn',
}

const ARRIVAL_COLORS: Record<string, string> = {
  EARLY: 'bg-blue-50 text-blue-700',
  ON_TIME: 'bg-green-50 text-green-700',
  LATE: 'bg-orange-50 text-orange-700',
}

interface ArrivalStatusBadgeProps {
  status?: ApiBookingArrivalStatus | null
  className?: string
}

export function ArrivalStatusBadge({ status, className }: ArrivalStatusBadgeProps) {
  if (!status) return null
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        ARRIVAL_COLORS[status] ?? 'bg-slate-100 text-slate-600',
        className,
      )}
    >
      {ARRIVAL_LABELS[status] ?? status}
    </span>
  )
}
