/**
 * Modal xác nhận staff tự nhận booking để kiểm tra xe.
 *
 * Dùng cho VEHICLE_INSPECTION_STAFF khi click "Nhận kiểm tra" trên BookingListPage.
 * Trước khi gọi PATCH /staff/workspace/bookings/:bookingId/claim-inspection,
 * hiển thị confirm dialog với thông tin booking (biển số, khung giờ).
 */
import { CarFront, Loader2, ScanSearch } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import type { Booking } from '../../types/booking'
import { getBookingCustomerName } from '../../utils/booking'
import { formatTime } from '../../utils/format'
import { WORKFLOW_PHASE_LABELS } from '../../types/api/workspace'

interface ClaimInspectionModalProps {
  open: boolean
  booking: Booking | null
  isSubmitting: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
}

export function ClaimInspectionModal({
  open,
  booking,
  isSubmitting,
  onClose,
  onConfirm,
}: ClaimInspectionModalProps) {
  if (!booking) return null

  const handleConfirm = async () => {
    try {
      await onConfirm()
    } catch {
      // Parent BookingListPage đã xử lý toast error.
    }
  }

  return (
    <Modal
      open={open}
      onClose={isSubmitting ? () => undefined : onClose}
      title="Nhận kiểm tra booking"
      description="Hành động này gán bạn là nhân viên kiểm tra chính cho booking."
      className="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
          <ScanSearch className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" />
          <div className="text-sm text-brand-900">
            Sau khi nhận, bạn chịu trách nhiệm tạo biên bản <strong>trước rửa</strong>
            {' '}và <strong>sau rửa</strong>. Nếu booking đã có nhân viên khác nhận,
            hệ thống sẽ từ chối (409 INSPECTION_ALREADY_CLAIMED).
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
          <div className="col-span-2 flex items-center gap-2 border-b border-slate-200 pb-2">
            <CarFront className="h-4 w-4 text-slate-500" />
            <span className="font-semibold text-slate-900">
              {booking.license_plate || '—'}
            </span>
            <span className="text-xs text-slate-500">
              · {getBookingCustomerName(booking) || 'Khách vãng lai'}
            </span>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Mã booking</dt>
            <dd className="mt-0.5 font-mono text-xs text-slate-900">
              {booking.id.replace('booking-', '#')}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Khung giờ</dt>
            <dd className="mt-0.5 text-slate-900">
              {formatTime(booking.start_time)} – {formatTime(booking.end_time)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Trạng thái</dt>
            <dd className="mt-0.5 text-slate-900">
              {booking.raw?.workflow_phase
                ? WORKFLOW_PHASE_LABELS[
                    booking.raw.workflow_phase as keyof typeof WORKFLOW_PHASE_LABELS
                  ] ?? booking.raw.workflow_phase
                : booking.status}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500">Phương tiện</dt>
            <dd className="mt-0.5 text-slate-900">
              {booking.vehicle_type === 'CAR'
                ? 'Ô tô'
                : booking.vehicle_type === 'MOTORBIKE'
                  ? 'Xe máy'
                  : booking.vehicle_type || '—'}
            </dd>
          </div>
        </dl>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang nhận…
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4" />
                Xác nhận nhận kiểm tra
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}