import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { getServicePackageName } from '../../mocks/servicePackages'
import type { Booking } from '../../types/booking'
import { getBookingCustomerName } from '../../utils/booking'
import { formatPrice } from '../../utils/format'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface CompleteServiceModalProps {
  open: boolean
  onClose: () => void
  booking: Booking
  onConfirm: () => Promise<{ success: boolean; message: string }>
}

export function CompleteServiceModal({
  open,
  onClose,
  booking,
  onConfirm,
}: CompleteServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)
    await new Promise((resolve) => setTimeout(resolve, 400))

    const result = await onConfirm()
    setIsSubmitting(false)

    if (result.success) {
      onClose()
      return
    }

    setError(result.message)
  }

  const handleClose = () => {
    if (isSubmitting) return
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Hoàn thành dịch vụ"
      description="Xác nhận tất cả bước đã xong và kết thúc quy trình rửa xe."
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <p className="font-medium text-slate-900">
            {booking.id.replace('booking-', '#')} · {booking.license_plate}
          </p>
          <p className="mt-1 text-slate-600">
            {getBookingCustomerName(booking)}
          </p>
          <p className="mt-1 text-slate-500">
            {getServicePackageName(booking.service_package_id)}
          </p>
          <p className="mt-2 font-semibold text-blue-600">
            {formatPrice(booking.final_price)}
          </p>
        </div>

        <p className="text-sm text-slate-600">
          Buồng rửa (nếu có) sẽ được giải phóng. Khách chuyển sang trạng thái{' '}
          <span className="font-medium text-slate-900">Hoàn thành</span> và có
          thể thanh toán tại quầy.
        </p>

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Hủy
          </Button>
          <Button fullWidth onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Xác nhận hoàn thành
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
