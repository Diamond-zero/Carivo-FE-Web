// ============================================================================
// PlateScanStatusBadge — render 13 canonical status của BookingPlateScan.
// Phase 2.3: tách từ inline badge ở Phase 1 staff pages.
// ============================================================================

import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  Clock,
  EyeOff,
  Loader2,
  ScanLine,
  ShieldX,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react'

import {
  PLATE_SCAN_STATUS_LABELS,
  PLATE_SCAN_STATUS_VARIANT,
} from '../../../api/plateScan.api'
import type { PlateScanStatus } from '../../../types/api/plateScan'
import { Badge } from '../../ui/Badge'

interface Props {
  status: PlateScanStatus
  className?: string
}

const STATUS_ICON: Record<PlateScanStatus, typeof Camera> = {
  CAPTURED: Camera,
  RECOGNIZING: Loader2,
  QUALITY_REJECTED: AlertTriangle,
  EXACT_MATCH: CheckCircle2,
  FUZZY_CANDIDATES: Sparkles,
  AMBIGUOUS: AlertTriangle,
  NO_MATCH: XCircle,
  MULTIPLE_PLATES: EyeOff,
  ARRIVAL_DETECTED: ScanLine,
  CONFIRMED: CheckCircle2,
  REJECTED: X,
  EXPIRED: Clock,
  FAILED: ShieldX,
}

/**
 * Status badge cho `BookingPlateScan.status` — canonical 13 giá trị theo
 * `BE bookingArrival.constant.PLATE_SCAN_STATUSES`.
 *
 * @example
 * ```tsx
 * <PlateScanStatusBadge status={scan.status} />
 * <PlateScanStatusBadge status="EXACT_MATCH" className="ml-2" />
 * ```
 */
export function PlateScanStatusBadge({ status, className }: Props) {
  const Icon = STATUS_ICON[status]
  const variant = PLATE_SCAN_STATUS_VARIANT[status] ?? 'default'
  const label = PLATE_SCAN_STATUS_LABELS[status] ?? status

  return (
    <Badge variant={variant} className={className}>
      <Icon
        className={`mr-1 h-3 w-3 ${
          status === 'RECOGNIZING' ? 'animate-spin' : ''
        }`}
      />
      {label}
    </Badge>
  )
}

export { PLATE_SCAN_STATUS_LABELS }
