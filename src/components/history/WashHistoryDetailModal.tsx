import { ExternalLink, Loader2, Phone, UserRound } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ApiBooking, ApiWashHistory } from '../../types/api/staff'
import { getWashHistoryByIdApi } from '../../api/washHistory.api'
import { getApiErrorMessage } from '../../api/client'
import {
  mapApiWashHistory,
  resolveWashHistoryCustomerPhone,
  resolveWashHistoryIsWalkIn,
} from '../../lib/mappers/staffMappers'
import type { WashHistory } from '../../types/washHistory'
import { formatDateTime, formatPrice } from '../../utils/format'
import { fetchWashHistoryBookingFallback } from '../../utils/washHistoryEnrichment'
import {
  formatBookingIdLabel,
  formatWashHistoryIdLabel,
  isRealWashHistoryId,
} from '../../utils/washHistory'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

interface WashHistoryDetailModalProps {
  history: WashHistory | null
  open: boolean
  onClose: () => void
  /** Prefix cho link "Xem booking". Mặc định phù hợp cả admin và staff. */
  bookingLinkPrefix?: string
}

function getWashHistoryDisplayFields(
  item: ApiWashHistory,
  booking?: ApiBooking | null,
) {
  const mapped = mapApiWashHistory(item, booking)
  return {
    customerName: mapped.customer_name,
    customerPhone: resolveWashHistoryCustomerPhone(item, booking),
    isWalkIn: resolveWashHistoryIsWalkIn(item, booking),
    licensePlate: mapped.license_plate,
    servicePackageName:
      mapped.service_package_name ?? mapped.service_package_id,
    finalPrice: mapped.final_price,
    originalPrice: item.original_price,
    discountAmount: item.discount_amount,
    pointsUsed: item.points_used,
    washedAt: mapped.washed_at,
    serviceCompletedAt: item.service_completed_at,
    earnedPoints: mapped.earned_points,
    paymentMethod: mapped.payment_method === 'PAYOS' ? 'PayOS' : 'Tiền mặt',
    bookingId: item.booking_id,
  }
}

export function WashHistoryDetailModal({
  history,
  open,
  onClose,
  bookingLinkPrefix = '/admin/bookings/',
}: WashHistoryDetailModalProps) {
  const [detail, setDetail] = useState<ApiWashHistory | null>(null)
  const [bookingFallback, setBookingFallback] = useState<ApiBooking | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const historyId = history?.id ?? null
  const canFetchDetail = Boolean(historyId && isRealWashHistoryId(historyId))

  useEffect(() => {
    if (!open || !canFetchDetail || !historyId) {
      setDetail(null)
      setBookingFallback(null)
      setError(null)
      return
    }

    let cancelled = false
    setIsLoading(true)
    setError(null)
    setBookingFallback(null)

    void getWashHistoryByIdApi(historyId)
      .then(async (data) => {
        if (cancelled) return

        const booking = await fetchWashHistoryBookingFallback(data)
        if (cancelled) return

        setDetail(data)
        setBookingFallback(booking)
      })
      .catch((loadError) => {
        if (!cancelled) {
          setError(getApiErrorMessage(loadError, 'Không thể tải chi tiết.'))
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, historyId, canFetchDetail])

  const display = detail ? getWashHistoryDisplayFields(detail, bookingFallback) : null
  const bookingId = display?.bookingId ?? history?.booking_id

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi tiết lịch sử rửa"
      description={
        historyId ? formatWashHistoryIdLabel(historyId) : undefined
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : display ? (
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Khách</dt>
            <dd className="text-right">
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <span className="font-medium text-slate-900">
                  {display.customerName || '—'}
                </span>
                {display.isWalkIn ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700"
                    title="Khách vãng lai — không liên kết tài khoản khách hàng"
                  >
                    <UserRound className="h-3 w-3" />
                    Vãng lai
                  </span>
                ) : null}
              </div>
              {display.customerPhone ? (
                <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-slate-500">
                  <Phone className="h-3 w-3" />
                  <span>{display.customerPhone}</span>
                </p>
              ) : null}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Biển số</dt>
            <dd className="font-medium text-slate-900">
              {display.licensePlate || '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Gói dịch vụ</dt>
            <dd className="font-medium text-slate-900">
              {display.servicePackageName}
            </dd>
          </div>
          {display.originalPrice != null ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Giá gốc</dt>
              <dd className="text-slate-700">{formatPrice(display.originalPrice)}</dd>
            </div>
          ) : null}
          {(display.discountAmount ?? 0) > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Giảm giá</dt>
              <dd className="text-emerald-700">
                -{formatPrice(display.discountAmount!)}
              </dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Thành tiền</dt>
            <dd className="font-semibold text-brand-700">
              {formatPrice(display.finalPrice)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Thanh toán</dt>
            <dd className="font-medium text-slate-900">{display.paymentMethod}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Thời gian thanh toán</dt>
            <dd className="font-medium text-slate-900">
              {display.washedAt ? formatDateTime(display.washedAt) : '—'}
            </dd>
          </div>
          {display.serviceCompletedAt ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Hoàn thành dịch vụ</dt>
              <dd className="font-medium text-slate-900">
                {formatDateTime(display.serviceCompletedAt)}
              </dd>
            </div>
          ) : null}
          {(display.pointsUsed ?? 0) > 0 ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Điểm đã dùng</dt>
              <dd className="font-medium text-slate-900">{display.pointsUsed}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Điểm tích lũy</dt>
            <dd className="font-medium text-slate-900">{display.earnedPoints}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-sm text-slate-500">Không có dữ liệu.</p>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {bookingId ? (
          <Link to={`${bookingLinkPrefix}${bookingId}`} onClick={onClose}>
            <Button variant="secondary" fullWidth>
              <ExternalLink className="h-4 w-4" />
              Xem booking {formatBookingIdLabel(bookingId)}
            </Button>
          </Link>
        ) : null}
        <Button variant="secondary" fullWidth onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  )
}

