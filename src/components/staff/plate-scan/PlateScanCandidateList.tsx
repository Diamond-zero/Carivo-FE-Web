// ============================================================================
// PlateScanCandidateList — render `BookingPlateScan.candidates[]`.
//
// Phase 2.4: BE trả candidate.booking là DTO booking đầy đủ (populate từ
// `BookingMapper.toBookingDto`). Component này map các field phức tạp của
// booking DTO sang hiển thị staff-friendly.
// ============================================================================

import {
  AlertTriangle,
  Car,
  CircleCheck,
  Clock,
  ScanLine,
  User,
} from 'lucide-react'

import { Badge } from '../../ui/Badge'
import { cn } from '../../../lib/utils'
import type {
  ApiPlateScanCandidate,
  ApiPlateScanCandidateBooking,
  PlateMatchType,
} from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

interface Props {
  candidates: ApiPlateScanCandidate[]
  /** Booking id đang được staff chọn (controlled). */
  selectedBookingId: string | null
  onSelect: (bookingId: string) => void
  /** disabled khi scan đã terminal. */
  disabled?: boolean
}

const MATCH_TYPE_VARIANT: Record<PlateMatchType, 'success' | 'warning' | 'info' | 'default'> = {
  EXACT: 'success',
  FUZZY: 'warning',
  MANUAL: 'info',
  NONE: 'default',
}

const MATCH_TYPE_LABEL: Record<PlateMatchType, string> = {
  EXACT: 'EXACT',
  FUZZY: 'FUZZY',
  MANUAL: 'MANUAL',
  NONE: 'NONE',
}

/** % khớp ước tính từ edit_distance — giả định độ dài biển số tối đa 8 ký tự
 * (xe VN phổ biến 7-9 ký tự). Đây chỉ là hint cho staff; BE mới là quyết định. */
const computeMatchPercent = (editDistance: number) =>
  Math.max(0, Math.min(100, Math.round((1 - editDistance / 8) * 100)))

const getCustomerName = (booking: ApiPlateScanCandidateBooking | null): string => {
  return booking?.customer?.full_name?.trim() || 'Khách vãng lai'
}

const getVehicleLabel = (booking: ApiPlateScanCandidateBooking | null): string => {
  if (!booking?.vehicle) return '—'
  const parts = [booking.vehicle.brand, booking.vehicle.model]
    .filter(Boolean)
    .map((s) => s?.trim())
    .filter(Boolean)
  const joined = parts.join(' ')
  if (joined) return joined
  return booking.vehicle.color?.trim() || booking.vehicle.license_plate || '—'
}

const getLicensePlate = (
  booking: ApiPlateScanCandidateBooking | null,
  fallback: string | null,
): string => {
  return (
    booking?.vehicle?.license_plate?.trim() ||
    booking?.license_plate?.trim() ||
    fallback ||
    '—'
  )
}

export function PlateScanCandidateList({
  candidates,
  selectedBookingId,
  onSelect,
  disabled,
}: Props) {
  if (candidates.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
        BE không tìm được booking nào khớp với biển số này trong cửa sổ check-in
        (mặc định ±120 phút). Staff có thể reject hoặc gửi yêu cầu xe thay thế.
      </p>
    )
  }

  return (
    <ul className="space-y-2" role="radiogroup" aria-label="Booking ứng viên">
      {candidates.map((candidate) => {
        const booking = candidate.booking
        const isSelected = selectedBookingId === candidate.booking_id
        const matchVariant = MATCH_TYPE_VARIANT[candidate.match_type]
        const matchLabel = MATCH_TYPE_LABEL[candidate.match_type]
        const matchPercent = computeMatchPercent(candidate.edit_distance)
        const customerName = getCustomerName(booking)
        const vehicleLabel = getVehicleLabel(booking)
        const licensePlate = getLicensePlate(booking, null)

        return (
          <li key={candidate.booking_id}>
            <label
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors',
                isSelected
                  ? 'border-brand-500 bg-brand-50/40 ring-1 ring-brand-300'
                  : 'border-slate-200 hover:bg-slate-50',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <input
                type="radio"
                name="plate-scan-candidate"
                className="mt-1 h-4 w-4 text-brand-600 focus:ring-brand-500"
                checked={isSelected}
                onChange={() => onSelect(candidate.booking_id)}
                disabled={disabled}
                aria-label={`Chọn booking ${licensePlate}`}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-base font-bold text-slate-900">
                    {licensePlate}
                  </p>
                  <Badge variant={matchVariant}>
                    {matchLabel} · {matchPercent}%
                  </Badge>
                  {candidate.vehicle_type_mismatch ? (
                    <Badge variant="warning">
                      <AlertTriangle className="mr-1 h-3 w-3" />
                      Loại xe lệch
                    </Badge>
                  ) : null}
                  {candidate.match_type === 'EXACT' ? (
                    <Badge variant="success">
                      <CircleCheck className="mr-1 h-3 w-3" />
                      Khớp chính xác
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-700">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  {customerName}
                </p>
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <Car className="h-3.5 w-3.5 text-slate-400" />
                  {vehicleLabel}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                  <span className="font-mono">
                    Booking #{candidate.booking_id.slice(-6)}
                  </span>
                  {booking?.start_time ? (
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(booking.start_time)}
                    </span>
                  ) : null}
                  {candidate.scheduled_distance_minutes ? (
                    <span className="inline-flex items-center gap-1">
                      <ScanLine className="h-3 w-3" />
                      lệch {candidate.scheduled_distance_minutes}p
                    </span>
                  ) : null}
                </p>
              </div>
            </label>
          </li>
        )
      })}
    </ul>
  )
}