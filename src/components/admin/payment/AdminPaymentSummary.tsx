import { useMemo } from 'react'
import {
  Banknote,
  CheckCircle2,
  Clock,
  Receipt,
} from 'lucide-react'
import { StatCard } from '../../ui/StatCard'
import type { Booking } from '../../../types/booking'
import { formatPrice } from '../../../utils/format'

interface AdminPaymentSummaryProps {
  bookings: Booking[]
}

export function AdminPaymentSummary({ bookings }: AdminPaymentSummaryProps) {
  const stats = useMemo(() => {
    const total = bookings.length
    const paid = bookings.filter((b) => b.payment_status === 'PAID')
    const pending = bookings.filter((b) => b.payment_status === 'PENDING')
    const refunded = bookings.filter((b) => b.payment_status === 'REFUNDED')
    const failed = bookings.filter((b) => b.payment_status === 'FAILED')

    const gmv = paid.reduce((sum, b) => sum + b.final_price, 0)
    const pendingAmount = pending.reduce((sum, b) => sum + b.final_price, 0)

    return {
      total,
      paidCount: paid.length,
      pendingCount: pending.length,
      refundedCount: refunded.length,
      failedCount: failed.length,
      gmv,
      pendingAmount,
    }
  }, [bookings])

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Tổng giao dịch"
        value={stats.total}
        icon={Receipt}
        accent="brand"
      />
      <StatCard
        label="Đã thanh toán"
        value={stats.paidCount}
        icon={CheckCircle2}
        accent="emerald"
        hint={formatPrice(stats.gmv)}
      />
      <StatCard
        label="Đang chờ thanh toán"
        value={stats.pendingCount}
        icon={Clock}
        accent="amber"
        hint={formatPrice(stats.pendingAmount)}
      />
      <StatCard
        label="Hoàn tiền / Thất bại"
        value={stats.refundedCount + stats.failedCount}
        icon={Banknote}
        accent="red"
        hint={
          stats.failedCount > 0
            ? `${stats.refundedCount} hoàn · ${stats.failedCount} lỗi`
            : `${stats.refundedCount} hoàn tiền`
        }
      />
    </div>
  )
}
