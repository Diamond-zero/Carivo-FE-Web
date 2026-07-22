import { CheckCircle2, Loader2, ExternalLink, Sparkles, Ticket } from 'lucide-react'
import { useState } from 'react'
import type { Booking } from '../../types/booking'
import { getBookingCustomerName } from '../../utils/booking'
import { calculateEarnedPoints } from '../../utils/payment'
import { formatPrice } from '../../utils/format'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Modal } from '../ui/Modal'
import { cn } from '../../lib/utils'

interface MarkPaidResult {
  success: boolean
  message: string
  earnedPoints?: number
  checkoutUrl?: string
}

interface MarkPaidModalProps {
  open: boolean
  onClose: () => void
  booking: Booking
  onConfirmCash: () => Promise<MarkPaidResult>
  onConfirmPayos?: () => Promise<MarkPaidResult>
}

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

export function MarkPaidModal({
  open,
  onClose,
  booking,
  onConfirmCash,
  onConfirmPayos,
}: MarkPaidModalProps) {
  const [method, setMethod] = useState<'CASH' | 'PAYOS'>('CASH')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const earnedPointsPreview = calculateEarnedPoints(booking)

  const handleConfirm = async () => {
    setSubmitState('submitting')
    setError(null)
    setCheckoutUrl(null)
    setSuccessMessage(null)

    const result =
      method === 'PAYOS' && onConfirmPayos
        ? await onConfirmPayos()
        : await onConfirmCash()

    if (!result.success) {
      setSubmitState('error')
      setError(result.message)
      return
    }

    if (result.checkoutUrl) {
      setCheckoutUrl(result.checkoutUrl)
      setSubmitState('success')
      setSuccessMessage(result.message)
      return
    }

    // Cash payment success — show success state
    setSuccessMessage(result.message ?? 'Thu tiền thành công.')
    setSubmitState('success')
  }

  const handleClose = () => {
    if (submitState === 'submitting') return
    setError(null)
    setCheckoutUrl(null)
    setSuccessMessage(null)
    setMethod('CASH')
    setSubmitState('idle')
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Xác nhận thanh toán"
      description="Thu tiền mặt hoặc tạo link PayOS cho khách."
    >
      <div className="space-y-4">
        <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
          <p className="font-medium text-slate-900">
            {booking.id.replace('booking-', '#')} · {booking.license_plate}
          </p>
          <p className="mt-1 text-slate-600">{getBookingCustomerName(booking)}</p>
        </div>

        <div>
          <Label htmlFor="final-price">Số tiền</Label>
          <Input
            id="final-price"
            readOnly
            value={formatPrice(booking.final_price)}
            className="mt-1.5 font-semibold text-brand-700"
          />
        </div>

        {/* BE payment workflow docs: voucher bồi thường từ incident sẽ giảm
            một phần final_price. Hiển thị minh bạch cho staff khi thu tiền. */}
        {booking.customer_voucher && booking.voucher_discount_amount ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <div className="flex items-center gap-2 font-medium">
              <Ticket className="h-4 w-4" />
              Đã áp dụng voucher bồi thường {booking.customer_voucher.code}
            </div>
            <p className="mt-1">
              Khách được giảm {formatPrice(booking.voucher_discount_amount)}.{' '}
              <span className="font-semibold">
                Không được hủy hoặc thu thêm phần này.
              </span>
            </p>
          </div>
        ) : null}

        {/* BE PATCH /admin/bookings/:id/complete-service → PAYMENT_READY */}
        {booking.operation_status === 'AWAITING_PAYMENT' ? (
          <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
            <div className="flex items-center gap-2 font-medium">
              <Sparkles className="h-4 w-4" />
              Dịch vụ hoàn tất — sẵn sàng thu tiền
            </div>
            <p className="mt-1">
              Hệ thống vừa nhận tín hiệu <code>PAYMENT_READY</code>. Khách có
              thể đã hoặc chưa tạo QR; staff tạo QR sẽ dùng chung payment với
              khách.
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-2">
          {(['CASH', 'PAYOS'] as const).map((option) => (
            <button
              key={option}
              type="button"
              disabled={
                option === 'PAYOS' && !onConfirmPayos
                  ? true
                  : submitState === 'success' || submitState === 'submitting'
                    ? true
                    : undefined
              }
              onClick={() => setMethod(option)}
              className={cn(
                'rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                method === option
                  ? 'border-brand-500 bg-brand-50 text-brand-800'
                  : 'border-slate-200 text-slate-700',
                (option === 'PAYOS' && !onConfirmPayos) ||
                  submitState === 'success' ||
                  submitState === 'submitting'
                  ? 'opacity-50'
                  : '',
              )}
            >
              {option === 'CASH' ? 'Tiền mặt' : 'PayOS (QR)'}
            </button>
          ))}
        </div>

        {booking.payment_status === 'PENDING' && submitState !== 'success' ? (
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Booking đang có link PayOS chờ thanh toán. Xác nhận tiền mặt sẽ tự động hủy
            link PayOS hiện tại.
          </p>
        ) : null}

        {earnedPointsPreview > 0 && submitState !== 'success' ? (
          <p className="rounded-xl bg-violet-50 px-4 py-3 text-sm text-violet-800">
            Khách đăng ký có thể được cộng {earnedPointsPreview} điểm sau thanh toán.
          </p>
        ) : null}

        {submitState === 'success' && successMessage ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Thanh toán thành công
            </div>
            <p className="mt-1">{successMessage}</p>
          </div>
        ) : null}

        {checkoutUrl ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            <p className="font-medium">Đã tạo link PayOS</p>
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-green-900 underline"
            >
              Mở trang thanh toán
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
        ) : null}

        <div className="flex gap-3 pt-1">
          <Button
            variant="secondary"
            fullWidth
            onClick={handleClose}
            disabled={submitState === 'submitting'}
          >
            {submitState === 'success' || checkoutUrl ? 'Đóng' : 'Hủy'}
          </Button>
          {submitState !== 'success' && !checkoutUrl ? (
            <Button
              fullWidth
              onClick={handleConfirm}
              disabled={submitState === 'submitting'}
            >
              {submitState === 'submitting' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : method === 'CASH' ? (
                'Xác nhận đã thu tiền'
              ) : (
                'Tạo link PayOS'
              )}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
