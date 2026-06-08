import { Coins, Minus, Plus } from 'lucide-react'
import type { LoyaltyPointRecord } from '../../types/loyalty'
import { formatDateTime } from '../../utils/format'
import { EmptyState } from '../ui/EmptyState'

interface LoyaltyPointHistoryListProps {
  records: LoyaltyPointRecord[]
}

const POINT_TYPE_LABELS: Record<LoyaltyPointRecord['type'], string> = {
  EARNED: 'Tích điểm',
  REDEEMED: 'Đổi điểm',
  EXPIRED: 'Hết hạn',
}

const POINT_TYPE_COLORS: Record<LoyaltyPointRecord['type'], string> = {
  EARNED: 'bg-emerald-50 text-emerald-600',
  REDEEMED: 'bg-blue-50 text-blue-600',
  EXPIRED: 'bg-slate-100 text-slate-500',
}

export function LoyaltyPointHistoryList({ records }: LoyaltyPointHistoryListProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        compact
        icon={Coins}
        title="Chưa có lịch sử điểm"
        description="Các giao dịch tích/đổi điểm sẽ hiển thị tại đây."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {records.map((record) => {
        const isPositive = record.type === 'EARNED'
        const Icon = isPositive ? Plus : Minus

        return (
          <li key={record.id} className="flex gap-4 px-1 py-4 first:pt-0 last:pb-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${POINT_TYPE_COLORS[record.type]}`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{record.description}</p>
                <span
                  className={`text-sm font-semibold ${
                    isPositive ? 'text-emerald-600' : 'text-slate-600'
                  }`}
                >
                  {isPositive ? '+' : '-'}
                  {record.points}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {POINT_TYPE_LABELS[record.type]}
                {record.related_booking_id
                  ? ` · ${record.related_booking_id.replace('booking-', '#')}`
                  : ''}{' '}
                · {formatDateTime(record.created_at)}
              </p>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
