import { ArrowUpCircle, History } from 'lucide-react'
import type { TierUpgradeRecord } from '../../types/loyalty'
import { formatDateTime } from '../../utils/format'
import { EmptyState } from '../ui/EmptyState'
import { TierBadge } from './TierBadge'

interface TierUpgradeHistoryListProps {
  records: TierUpgradeRecord[]
}

export function TierUpgradeHistoryList({ records }: TierUpgradeHistoryListProps) {
  if (records.length === 0) {
    return (
      <EmptyState
        compact
        icon={History}
        title="Chưa có lịch sử nâng hạ"
        description="Lịch sử nâng hạ loyalty sẽ hiển thị tại đây."
      />
    )
  }

  return (
    <ul className="divide-y divide-slate-100">
      {records.map((record) => (
        <li key={record.id} className="flex gap-4 px-1 py-4 first:pt-0 last:pb-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <ArrowUpCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {record.from_tier ? (
                <>
                  <TierBadge tier={record.from_tier} />
                  <span className="text-slate-400">→</span>
                </>
              ) : (
                <span className="text-sm text-slate-500">Khởi tạo</span>
              )}
              <TierBadge tier={record.to_tier} />
            </div>
            <p className="mt-1 text-sm text-slate-600">{record.reason}</p>
            <p className="mt-1 text-xs text-slate-400">
              {formatDateTime(record.upgraded_at)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
