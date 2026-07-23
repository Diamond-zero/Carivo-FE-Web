// ============================================================================
// ConfirmOverrideModal — modal bắt buộc nhập override_reason khi staff chọn
// booking có match_type = FUZZY / MANUAL.
//
// Phase 2.6: BE `bookingArrival.service.confirmScan` sẽ reject nếu
// `booking.normalized_license_plate !== scan.normalized_plate` mà thiếu
// `override_reason` (trừ khi alternate vehicle đã được APPROVED).
// ============================================================================

import { Loader2, Send, ShieldAlert, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import type {
  ApiPlateScanCandidate,
  ApiPlateScanCandidateBooking,
} from '../../../types/api/plateScan'
import { formatDateTime } from '../../../utils/format'

const MIN_REASON_LENGTH = 5
const MAX_REASON_LENGTH = 1000

interface Props {
  open: boolean
  scan: { normalized_plate: string | null; raw_plate_text: string | null }
  candidate: ApiPlateScanCandidate | null
  onClose: () => void
  onConfirm: (params: { booking_id: string; override_reason: string }) => void
  isSubmitting: boolean
}

const getBookingLabel = (booking: ApiPlateScanCandidateBooking | null): string => {
  if (!booking) return '—'
  return booking.license_plate ?? booking.normalized_license_plate ?? '—'
}

export function ConfirmOverrideModal({
  open,
  scan,
  candidate,
  onClose,
  onConfirm,
  isSubmitting,
}: Props) {
  const [reason, setReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    if (open) {
      setReason('')
      // Auto-focus textarea sau khi modal open
      setTimeout(() => textareaRef.current?.focus(), 80)
    }
  }, [open])

  const trimmed = reason.trim()
  const isValid = trimmed.length >= MIN_REASON_LENGTH

  if (!candidate) return null

  const booking = candidate.booking
  const matchTypeLabel =
    candidate.match_type === 'FUZZY' ? 'FUZZY' : 'MANUAL'

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!isValid || isSubmitting) return
    onConfirm({
      booking_id: candidate.booking_id,
      override_reason: trimmed,
    })
  }

  return (
    <Modal open={open} onClose={onClose} title="Lý do chọn booking khớp không chính xác">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900">
          <p className="flex items-start gap-2 font-semibold">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
            Booking khớp {matchTypeLabel} — staff phải ghi rõ lý do.
          </p>
          <p className="mt-1.5 text-xs text-amber-800">
            Biển số trên ảnh{' '}
            <span className="font-mono font-bold">
              {scan.normalized_plate ?? scan.raw_plate_text ?? '—'}
            </span>{' '}
            không khớp chính xác với booking{' '}
            <span className="font-mono font-bold">{getBookingLabel(booking)}</span>.
            Lý do sẽ được lưu vào audit log và hiển thị trong trang admin.
          </p>
        </div>

        {booking ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
            <dt className="text-slate-500">Khách hàng</dt>
            <dd className="font-medium text-slate-800">
              {booking.customer?.full_name ?? '—'}
            </dd>
            <dt className="text-slate-500">Bắt đầu</dt>
            <dd className="font-medium text-slate-800">
              {booking.start_time ? formatDateTime(booking.start_time) : '—'}
            </dd>
            <dt className="text-slate-500">Booking #</dt>
            <dd className="font-mono text-slate-800">
              …{candidate.booking_id.slice(-6)}
            </dd>
            <dt className="text-slate-500">Edit distance</dt>
            <dd className="font-mono text-slate-800">
              {candidate.edit_distance}
            </dd>
          </dl>
        ) : null}

        <div>
          <Label htmlFor="override-reason">
            Lý do override (tối thiểu {MIN_REASON_LENGTH} ký tự, tối đa{' '}
            {MAX_REASON_LENGTH})
          </Label>
          <textarea
            id="override-reason"
            ref={textareaRef}
            rows={4}
            maxLength={MAX_REASON_LENGTH}
            placeholder="VD: Biển số bị mờ do nắng chói, staff đã xác nhận trực tiếp với khách qua điện thoại."
            className="mt-2 min-h-[100px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={isSubmitting}
          />
          <p className="mt-1 flex items-center justify-between text-xs">
            <span
              className={
                isValid
                  ? 'text-green-700'
                  : trimmed.length === 0
                    ? 'text-slate-500'
                    : 'text-amber-700'
              }
            >
              {trimmed.length}/{MAX_REASON_LENGTH} ký tự
            </span>
            {!isValid && trimmed.length > 0 ? (
              <span className="text-amber-700">
                Cần thêm {MIN_REASON_LENGTH - trimmed.length} ký tự nữa.
              </span>
            ) : null}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            <X className="h-4 w-4" />
            Hủy
          </Button>
          <Button type="submit" disabled={!isValid || isSubmitting}>
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Xác nhận check-in
          </Button>
        </div>
      </form>
    </Modal>
  )
}