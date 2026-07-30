import { CheckCircle2, Loader2 } from 'lucide-react'
import { useState } from 'react'

import { getApiErrorMessage } from '../../../api/client'
import {
  confirmBookingVehiclePriceApi,
  reviewBookingVehiclePriceApi,
} from '../../../api/pricing.api'
import type {
  VehiclePriceReview,
  VehiclePricingSnapshot,
} from '../../../types/api/pricing'
import type {
  ApiPlateScanCandidateBooking,
} from '../../../types/api/plateScan'
import { formatPrice } from '../../../utils/format'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'

interface PlateScanVehicleClassificationReviewProps {
  booking: ApiPlateScanCandidateBooking
  disabled: boolean
  onVerificationChange: (verified: boolean) => void
}

function getInitialSnapshot(
  booking: ApiPlateScanCandidateBooking,
): VehiclePricingSnapshot | null {
  if (booking.vehicle_type !== 'CAR' && booking.vehicle_type !== 'MOTORBIKE') {
    return null
  }

  const source =
    booking.verified_vehicle_snapshot ??
    booking.quoted_vehicle_snapshot ??
    booking.vehicle ??
    {}

  return {
    vehicle_type: booking.vehicle_type,
    engine_type: source.engine_type ?? null,
    motorbike_cc_group: source.motorbike_cc_group ?? null,
    car_body_type: source.car_body_type ?? null,
    seat_count: source.seat_count ?? null,
  }
}

function isSnapshotComplete(snapshot: VehiclePricingSnapshot) {
  if (!snapshot.engine_type) return false
  if (snapshot.vehicle_type === 'MOTORBIKE') {
    return Boolean(snapshot.motorbike_cc_group)
  }
  return Boolean(snapshot.car_body_type && snapshot.seat_count)
}

export function PlateScanVehicleClassificationReview({
  booking,
  disabled,
  onVerificationChange,
}: PlateScanVehicleClassificationReviewProps) {
  const [snapshot, setSnapshot] = useState<VehiclePricingSnapshot | null>(() =>
    getInitialSnapshot(booking),
  )
  const [review, setReview] = useState<VehiclePriceReview | null>(null)
  const [verified, setVerified] = useState(
    booking.pricing_review_status === 'NOT_REQUIRED' ||
      booking.pricing_review_status === 'CUSTOMER_ACCEPTED',
  )
  const [isReviewing, setIsReviewing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [customerConfirmed, setCustomerConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!snapshot) {
    return (
      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        Booking chưa có đủ loại xe để xác minh phân loại trước khi check-in.
      </section>
    )
  }

  const updateSnapshot = (values: Partial<VehiclePricingSnapshot>) => {
    setSnapshot((current) => (current ? { ...current, ...values } : current))
    setReview(null)
    setVerified(false)
    onVerificationChange(false)
    setCustomerConfirmed(false)
    setError(null)
  }

  const handleReview = async () => {
    if (!isSnapshotComplete(snapshot)) {
      setError('Vui lòng nhập đầy đủ phân loại xe thực tế.')
      return
    }

    setError(null)
    setIsReviewing(true)
    try {
      const result = await reviewBookingVehiclePriceApi(booking.id, snapshot)
      setReview(result)
      if (!result.requires_customer_confirmation) {
        setVerified(true)
        onVerificationChange(true)
      }
    } catch (reviewError) {
      setError(
        getApiErrorMessage(
          reviewError,
          'Không thể xác minh phân loại xe hoặc công suất phục vụ.',
        ),
      )
    } finally {
      setIsReviewing(false)
    }
  }

  const handleConfirm = async () => {
    if (!customerConfirmed || reason.trim().length < 3) {
      setError('Cần khách xác nhận và nhập lý do chênh lệch.')
      return
    }

    setError(null)
    setIsConfirming(true)
    try {
      await confirmBookingVehiclePriceApi(booking.id, {
        vehicle_snapshot: snapshot,
        customer_confirmed: true,
        reason: reason.trim(),
      })
      setVerified(true)
      onVerificationChange(true)
    } catch (confirmError) {
      setError(
        getApiErrorMessage(
          confirmError,
          'Không thể ghi nhận khách xác nhận chênh lệch.',
        ),
      )
    } finally {
      setIsConfirming(false)
    }
  }

  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <p className="text-sm font-semibold text-slate-900">
          Xác minh phân loại xe thực tế
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Camera xác định biển số và loại xe tổng quát. Staff cần kiểm tra thông
          tin tính giá trước khi xác nhận check-in.
        </p>
      </div>

      {verified ? (
        <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          <CheckCircle2 className="h-4 w-4" />
          Đã xác minh phân loại xe và công suất phục vụ.
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor={`plate-scan-engine-${booking.id}`} required>
                Động cơ
              </Label>
              <Select
                id={`plate-scan-engine-${booking.id}`}
                value={snapshot.engine_type ?? ''}
                disabled={disabled || isReviewing || isConfirming}
                onChange={(event) =>
                  updateSnapshot({
                    engine_type:
                      (event.target
                        .value as VehiclePricingSnapshot['engine_type']) || null,
                  })
                }
              >
                <option value="">Chọn động cơ</option>
                <option value="GASOLINE">Xăng</option>
                <option value="ELECTRIC">Điện</option>
              </Select>
            </div>

            {snapshot.vehicle_type === 'CAR' ? (
              <>
                <div>
                  <Label htmlFor={`plate-scan-body-${booking.id}`} required>
                    Kiểu dáng
                  </Label>
                  <Select
                    id={`plate-scan-body-${booking.id}`}
                    value={snapshot.car_body_type ?? ''}
                    disabled={disabled || isReviewing || isConfirming}
                    onChange={(event) =>
                      updateSnapshot({
                        car_body_type:
                          (event.target
                            .value as VehiclePricingSnapshot['car_body_type']) ||
                          null,
                      })
                    }
                  >
                    <option value="">Chọn kiểu dáng</option>
                    <option value="HATCHBACK">Hatchback</option>
                    <option value="SEDAN">Sedan</option>
                    <option value="SUV">SUV</option>
                    <option value="MPV">MPV</option>
                    <option value="PICKUP">Pickup</option>
                    <option value="VAN">Van</option>
                  </Select>
                </div>
                <div>
                  <Label htmlFor={`plate-scan-seats-${booking.id}`} required>
                    Số chỗ
                  </Label>
                  <Input
                    id={`plate-scan-seats-${booking.id}`}
                    type="number"
                    min={2}
                    max={16}
                    value={snapshot.seat_count ?? ''}
                    disabled={disabled || isReviewing || isConfirming}
                    onChange={(event) =>
                      updateSnapshot({
                        seat_count: event.target.value
                          ? Number(event.target.value)
                          : null,
                      })
                    }
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor={`plate-scan-cc-${booking.id}`} required>
                  Phân khối
                </Label>
                <Select
                  id={`plate-scan-cc-${booking.id}`}
                  value={snapshot.motorbike_cc_group ?? ''}
                  disabled={disabled || isReviewing || isConfirming}
                  onChange={(event) =>
                    updateSnapshot({
                      motorbike_cc_group:
                        (event.target
                          .value as VehiclePricingSnapshot['motorbike_cc_group']) ||
                        null,
                    })
                  }
                >
                  <option value="">Chọn phân khối</option>
                  <option value="UNDER_175CC">Dưới 175cc</option>
                  <option value="OVER_175CC">Từ 175cc</option>
                </Select>
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            disabled={disabled || isReviewing || isConfirming}
            onClick={handleReview}
          >
            {isReviewing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {isReviewing
              ? 'Đang kiểm tra...'
              : 'Kiểm tra phân loại và giá'}
          </Button>
        </>
      )}

      {review?.requires_customer_confirmation && !verified ? (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">
            Xe thực tế khác khai báo, cần khách xác nhận
          </p>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <span>Giá cũ: {formatPrice(review.previous_final_price)}</span>
            <span>Giá mới: {formatPrice(review.adjusted_final_price)}</span>
            <span>
              Thời lượng cũ: {review.previous_duration_minutes} phút
            </span>
            <span>
              Thời lượng mới: {review.adjusted_duration_minutes} phút
            </span>
          </div>
          <Textarea
            value={reason}
            disabled={disabled || isConfirming}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Lý do điều chỉnh phân loại"
          />
          <label className="flex items-start gap-2 text-sm text-amber-900">
            <input
              type="checkbox"
              className="mt-1"
              checked={customerConfirmed}
              disabled={disabled || isConfirming}
              onChange={(event) => setCustomerConfirmed(event.target.checked)}
            />
            Khách đã xem và đồng ý giá, thời lượng mới
          </label>
          <Button
            disabled={
              disabled ||
              isConfirming ||
              !customerConfirmed ||
              reason.trim().length < 3
            }
            onClick={handleConfirm}
          >
            {isConfirming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            {isConfirming
              ? 'Đang xác nhận...'
              : 'Ghi nhận khách xác nhận'}
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </section>
  )
}
