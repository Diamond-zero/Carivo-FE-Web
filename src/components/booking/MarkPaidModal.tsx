import { CircleDollarSign, Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import type { Booking } from '../../types/booking'
import { getBookingCustomerName } from '../../utils/booking'
import { calculateEarnedPoints } from '../../utils/payment'
import { formatPrice } from '../../utils/format'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Modal } from '../ui/Modal'

interface MarkPaidResult {
  success: boolean
  message: string
  earnedPoints?: number
}

interface MarkPaidModalProps {
  open: boolean
  onClose: () => void
  booking: Booking
  onConfirm: () => Promise<MarkPaidResult>
}

export function MarkPaidModal({
  open,
  onClose,
  booking,
  onConfirm,
}: MarkPaidModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const earnedPointsPreview = calculateEarnedPoints(booking)

  const handleConfirm = async () => {
    setIsSubmitting(true)
    setError(null)
    await new Promise((resolve) => setTimeout(resolve, 450))

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
      title="Xác nhận thanh toán"
      description="Thu tiền mặt tại quầy và cập nhật trạng thái thanh toán."
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <p className="font-medium text-slate-900">
            {booking.id.replace('booking-', '#')} · {booking.license_plate}
          </p>
          <p className="mt-1 text-slate-600">
            {getBookingCustomerName(booking)}
          </p>
        </div>

        <div>
          <Label htmlFor="final-price">Số tiền thu</Label>
          <div className="relative mt-1.5">
            <CircleDollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              id="final-price"
              readOnly
              value={formatPrice(booking.final_price)}
              className="pl-10 font-semibold text-blue-600"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="payment-method">Phương thức thanh toán</Label>
          <Input
            id="payment-method"
            readOnly
            value="Tiền mặt (CASH)"
            className="mt-1.5"
          />
        </div>

        {earnedPointsPreview > 0 ? (
          <div className="flex items-start gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-800">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Khách đăng ký sẽ được cộng{' '}
              <span className="font-semibold">{earnedPointsPreview} điểm</span>{' '}
              loyalty sau khi xác nhận (mock).
            </p>
          </div>
        ) : (
          <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Walk-in / khách chưa liên kết tài khoản — không cộng điểm loyalty.
          </p>
        )}

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
                Đang xác nhận...
              </>
            ) : (
              'Xác nhận đã thu tiền'
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
