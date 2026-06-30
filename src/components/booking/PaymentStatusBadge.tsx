import type { PaymentStatus } from '../../types/booking'
import { cn } from '../../lib/utils'

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ thanh toán',
  PAID: 'Đã thanh toán',
  PARTIAL: 'Thanh toán một phần',
  REFUNDED: 'Đã hoàn tiền',
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: 'bg-orange-100 text-orange-700',
  PENDING: 'bg-amber-100 text-amber-700',
  PAID: 'bg-green-100 text-green-700',
  PARTIAL: 'bg-slate-200 text-slate-700',
  REFUNDED: 'bg-blue-100 text-blue-700',
}

interface PaymentStatusBadgeProps {
  status: PaymentStatus
  className?: string
}

export function PaymentStatusBadge({
  status,
  className,
}: PaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        PAYMENT_STATUS_COLORS[status] ?? 'bg-slate-100 text-slate-600',
        className,
      )}
    >
      {PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  )
}
