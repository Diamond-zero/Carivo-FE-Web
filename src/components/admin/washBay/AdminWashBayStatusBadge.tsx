import { WASH_BAY_STATUS_COLORS, WASH_BAY_STATUS_LABELS } from '../../../constants/washBayStatus'
import type { WashBayStatus } from '../../../types/washBay'
import { cn } from '../../../lib/utils'

interface AdminWashBayStatusBadgeProps {
  status: WashBayStatus
}

export function AdminWashBayStatusBadge({ status }: AdminWashBayStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium',
        WASH_BAY_STATUS_COLORS[status],
      )}
    >
      {WASH_BAY_STATUS_LABELS[status]}
    </span>
  )
}
