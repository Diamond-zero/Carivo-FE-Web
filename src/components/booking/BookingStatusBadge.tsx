import {
  BOOKING_STATUS_COLORS,
  BOOKING_STATUS_LABELS,
} from '../../constants/bookingStatus'
import type { BookingStatus } from '../../types/booking'
import { cn } from '../../lib/utils'

interface BookingStatusBadgeProps {
  status: BookingStatus
  className?: string
}

export function BookingStatusBadge({ status, className }: BookingStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        BOOKING_STATUS_COLORS[status],
        className,
      )}
    >
      {BOOKING_STATUS_LABELS[status]}
    </span>
  )
}
