import { Ban, CircleDollarSign, Loader2, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { BOOKING_STATUS_LABELS } from '../../../constants/bookingStatus'
import type { Booking, BookingStatus } from '../../../types/booking'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'

interface AdminBookingStatusPanelProps {
  booking: Booking
  onUpdateStatus: (status: BookingStatus) => Promise<{ ok: boolean; message: string }>
  onMarkPaid: () => Promise<{ ok: boolean; message: string }>
  onCancel: () => Promise<{ ok: boolean; message: string }>
}

const editableStatuses: BookingStatus[] = [
  'PENDING',
  'CONFIRMED',
  'CHECKED_IN',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELED',
  'NO_SHOW',
]

export function AdminBookingStatusPanel({
  booking,
  onUpdateStatus,
  onMarkPaid,
  onCancel,
}: AdminBookingStatusPanelProps) {
  const [selectedStatus, setSelectedStatus] = useState<BookingStatus>(booking.status)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)
  const [isCancelOpen, setIsCancelOpen] = useState(false)
  const [isCanceling, setIsCanceling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const canMarkPaid =
    booking.status === 'COMPLETED' && booking.payment_status === 'UNPAID'
  const canCancel = !['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(booking.status)
  const statusChanged = selectedStatus !== booking.status

  const handleUpdateStatus = async () => {
    setIsUpdatingStatus(true)
    setError(null)
    const result = await onUpdateStatus(selectedStatus)
    setIsUpdatingStatus(false)

    if (!result.ok) {
      setError(result.message)
      setSelectedStatus(booking.status)
    }
  }

  const handleMarkPaid = async () => {
    setIsMarkingPaid(true)
    setError(null)
    const result = await onMarkPaid()
    setIsMarkingPaid(false)

    if (!result.ok) {
      setError(result.message)
    }
  }

  const handleCancel = async () => {
    setIsCanceling(true)
    setError(null)
    const result = await onCancel()
    setIsCanceling(false)

    if (result.ok) {
      setIsCancelOpen(false)
      setSelectedStatus('CANCELED')
      return
    }

    setError(result.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-xl border border-violet-200/80 bg-violet-50/60 p-4">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
        <div className="text-sm text-violet-900">
          <p className="font-semibold">Can thiệp Admin</p>
          <p className="mt-1 text-violet-800/90">
            Thay đổi trạng thái booking trên toàn hệ thống (mock). Hành động ghi nhận
            cục bộ, chưa đồng bộ Staff context.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
        <div>
          <Label htmlFor="admin-booking-status-select">Trạng thái booking</Label>
          <Select
            id="admin-booking-status-select"
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(event.target.value as BookingStatus)
            }
          >
            {editableStatuses.map((status) => (
              <option key={status} value={status}>
                {BOOKING_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
        <Button
          type="button"
          onClick={handleUpdateStatus}
          disabled={!statusChanged || isUpdatingStatus}
        >
          {isUpdatingStatus ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang cập nhật...
            </>
          ) : (
            'Cập nhật trạng thái'
          )}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          disabled={!canMarkPaid || isMarkingPaid}
          onClick={handleMarkPaid}
        >
          {isMarkingPaid ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              <CircleDollarSign className="h-4 w-4" />
              Đánh dấu đã thanh toán
            </>
          )}
        </Button>

        <Button
          type="button"
          variant="danger"
          disabled={!canCancel}
          onClick={() => setIsCancelOpen(true)}
        >
          <Ban className="h-4 w-4" />
          Hủy booking
        </Button>
      </div>

      <Modal
        open={isCancelOpen}
        onClose={() => !isCanceling && setIsCancelOpen(false)}
        title="Hủy booking?"
        description={`Booking ${booking.id.replace('booking-', 'BK-')} sẽ chuyển sang trạng thái CANCELED.`}
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsCancelOpen(false)}
            disabled={isCanceling}
          >
            Không hủy
          </Button>
          <Button variant="danger" onClick={handleCancel} disabled={isCanceling}>
            {isCanceling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang hủy...
              </>
            ) : (
              'Xác nhận hủy'
            )}
          </Button>
        </div>
      </Modal>
    </div>
  )
}
