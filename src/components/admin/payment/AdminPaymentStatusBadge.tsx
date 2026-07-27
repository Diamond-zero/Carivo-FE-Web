import { cn } from '../../../lib/utils'
import {
  ADMIN_PAYMENT_STATUS_LABELS,
  ADMIN_PAYMENT_STATUS_TONE,
  type AdminPaymentStatus,
} from '../../../constants/adminPayment'

interface AdminPaymentStatusBadgeProps {
  status: AdminPaymentStatus
  className?: string
}

export function AdminPaymentStatusBadge({
  status,
  className,
}: AdminPaymentStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
        ADMIN_PAYMENT_STATUS_TONE[status] ?? 'bg-slate-100 text-slate-600',
        className,
      )}
    >
      {ADMIN_PAYMENT_STATUS_LABELS[status] ?? status}
    </span>
  )
}
