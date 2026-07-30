import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  SearchX,
} from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { getApiErrorMessage } from '../../api/client'
import {
  confirmBookingVehiclePriceApi,
  reviewBookingVehiclePriceApi,
} from '../../api/pricing.api'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { GuardedActionButton } from '../../components/booking/GuardedActionButton'
import { LateArrivalModal } from '../../components/booking/LateArrivalModal'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { Select } from '../../components/ui/Select'
import { Textarea } from '../../components/ui/Textarea'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useToast } from '../../contexts/ToastContext'
import { useCheckInSearch } from '../../hooks/api/staff/useCheckInSearch'
import type { Booking } from '../../types/booking'
import type {
  VehiclePriceReview,
  VehiclePricingSnapshot,
} from '../../types/api/pricing'
import type {
  ApiLateArrivalOptions,
  LateArrivalResolution,
} from '../../types/api/staff'
import { getBookingCustomerName, getBookingPhone } from '../../utils/booking'
import { getCheckInGuard } from '../../utils/bookingActionGuards'
import { formatPrice, formatTime } from '../../utils/format'

const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Nhập biển số hoặc số điện thoại')
    .min(3, 'Tối thiểu 3 ký tự để tìm kiếm'),
})

type SearchFormValues = z.infer<typeof searchSchema>

function CheckInResultCard({
  booking,
  selected,
  onSelect,
}: {
  booking: Booking
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-xl border p-4 text-left transition-colors ${
        selected
          ? 'border-brand-400 bg-brand-50 ring-2 ring-brand-500/20'
          : 'border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-slate-900">
            {booking.id.replace('booking-', '#')} · {booking.license_plate}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {getBookingCustomerName(booking)} · {getBookingPhone(booking)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {booking.service_package_name ?? 'Gói dịch vụ'} ·{' '}
            {formatTime(booking.start_time)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
    </button>
  )
}

export function CheckInPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useAuth()
  const { showToast } = useToast()
  const {
    checkInBooking,
    getBookingById,
    getLateArrivalOptions,
    resolveLateArrival,
    refreshBookings,
  } = useBookings()
  const checkInSearch = useCheckInSearch()
  const searchCheckInBookings = checkInSearch.mutateAsync
  const linkedBookingId = searchParams.get('bookingId')
  const loadedBookingIdRef = useRef<string | null>(null)

  const [results, setResults] = useState<Booking[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [checkedInBookingId, setCheckedInBookingId] = useState<string | null>(
    null,
  )
  const [isCheckingIn, setIsCheckingIn] = useState(false)
  const [vehicleSnapshot, setVehicleSnapshot] =
    useState<VehiclePricingSnapshot | null>(null)
  const [priceReview, setPriceReview] = useState<VehiclePriceReview | null>(null)
  const [isReviewingPrice, setIsReviewingPrice] = useState(false)
  const [isConfirmingPrice, setIsConfirmingPrice] = useState(false)
  const [customerConfirmed, setCustomerConfirmed] = useState(false)
  const [adjustmentReason, setAdjustmentReason] = useState('')
  const [classificationVerified, setClassificationVerified] = useState(false)
  const [lateArrival, setLateArrival] = useState<{
    booking: Booking
    minutes: number
    options: ApiLateArrivalOptions | null
    isLoadingOptions: boolean
    optionsError: string | null
  } | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { query: '' },
  })

  const selectedBooking = selectedId
    ? results.find((booking) => booking.id === selectedId) ??
      getBookingById(selectedId)
    : null

  const selectBooking = useCallback((booking: Booking | null) => {
    setSelectedId(booking?.id ?? null)
    if (!booking) {
      setVehicleSnapshot(null)
      setPriceReview(null)
      setClassificationVerified(false)
      return
    }

    const raw = booking.raw
    const source = (
      raw?.verified_vehicle_snapshot ||
      raw?.quoted_vehicle_snapshot ||
      raw?.vehicle ||
      {}
    ) as Partial<VehiclePricingSnapshot>
    setVehicleSnapshot({
      vehicle_type: booking.vehicle_type,
      engine_type: source.engine_type || null,
      motorbike_cc_group: source.motorbike_cc_group || null,
      car_body_type: source.car_body_type || null,
      seat_count: source.seat_count || null,
    })
    setPriceReview(null)
    setCustomerConfirmed(false)
    setAdjustmentReason('')
    setClassificationVerified(raw?.pricing_review_status !== 'REVIEW_REQUIRED')
  }, [])

  useEffect(() => {
    if (!linkedBookingId) {
      loadedBookingIdRef.current = null
      return
    }
    const bookingId = linkedBookingId
    if (loadedBookingIdRef.current === bookingId) return

    loadedBookingIdRef.current = bookingId

    let cancelled = false

    async function loadBookingFromLink() {
      try {
        const cached = getBookingById(bookingId)
        const booking =
          cached ??
          (await searchCheckInBookings(bookingId)).find(
            (item) => item.id === bookingId,
          )

        if (cancelled || !booking) {
          if (!cancelled && !booking) {
            setSubmitError('Không tìm thấy booking từ liên kết.')
          }
          return
        }

        if (booking.status === 'CONFIRMED') {
          setResults([booking])
          selectBooking(booking)
          setHasSearched(true)
          setValue('query', booking.license_plate)
          return
        }

        setSubmitError(
          'Booking này không ở trạng thái Đã xác nhận, không thể check-in.',
        )
        setValue('query', booking.license_plate)
      } catch (error) {
        loadedBookingIdRef.current = null
        if (!cancelled) {
          setSubmitError(
            getApiErrorMessage(error, 'Không thể tải booking từ liên kết.'),
          )
        }
      }
    }

    void loadBookingFromLink()

    return () => {
      cancelled = true
    }
  }, [linkedBookingId, getBookingById, setValue, searchCheckInBookings, selectBooking])

  const onSearch = async (data: SearchFormValues) => {
    setSubmitError(null)
    setSuccessMessage(null)

    try {
      const found = await searchCheckInBookings(data.query)
      setResults(found)
      selectBooking(found.length === 1 ? found[0] : null)
      setHasSearched(true)
    } catch (error) {
      setResults([])
      selectBooking(null)
      setHasSearched(true)
      setSubmitError(
        getApiErrorMessage(error, 'Không thể tìm booking. Vui lòng thử lại.'),
      )
    }
  }

  const handleCheckIn = async () => {
    if (!selectedId) {
      setSubmitError('Vui lòng chọn booking cần check-in.')
      return
    }

    setSubmitError(null)
    setSuccessMessage(null)
    setIsCheckingIn(true)

    const result = await checkInBooking(selectedId)
    setIsCheckingIn(false)

    if (!result.success) {
      setSubmitError(result.message)
      if (result.lateResolutionRequired) {
        const target =
          getBookingById(selectedId) ??
          results.find((item) => item.id === selectedId)
        if (target) {
          setLateArrival({
            booking: target,
            minutes: result.lateMinutes ?? 0,
            options: null,
            isLoadingOptions: false,
            optionsError: null,
          })
        }
      }
      return
    }

    setSuccessMessage(result.message)
    setCheckedInBookingId(selectedId)
    setResults([])
    selectBooking(null)
    setHasSearched(false)
    setValue('query', '')
    // Clear ?bookingId để tránh useEffect loadBookingFromLink chạy lại booking vừa check-in
    if (searchParams.get('bookingId')) {
      setSearchParams({}, { replace: true })
    }
  }

  const updateVehicleSnapshot = (
    values: Partial<VehiclePricingSnapshot>,
  ) => {
    setVehicleSnapshot((current) => (current ? { ...current, ...values } : current))
    setPriceReview(null)
    setClassificationVerified(false)
    setCustomerConfirmed(false)
  }

  const handleReviewPrice = async () => {
    if (!selectedBooking || !vehicleSnapshot) return
    setSubmitError(null)
    setIsReviewingPrice(true)
    try {
      const review = await reviewBookingVehiclePriceApi(
        selectedBooking.id,
        vehicleSnapshot,
      )
      setPriceReview(review)
      setClassificationVerified(!review.requires_customer_confirmation)
      if (!review.requires_customer_confirmation) {
        void refreshBookings().catch(() => undefined)
        showToast('Phân loại xe thực tế khớp với booking.', 'success')
      }
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(
          error,
          'Không thể xác minh giá hoặc garage không còn đủ công suất.',
        ),
      )
    } finally {
      setIsReviewingPrice(false)
    }
  }

  const handleConfirmPrice = async () => {
    if (
      !selectedBooking ||
      !vehicleSnapshot ||
      !customerConfirmed ||
      adjustmentReason.trim().length < 3
    ) {
      setSubmitError('Cần khách xác nhận và nhập lý do chênh lệch.')
      return
    }
    setSubmitError(null)
    setIsConfirmingPrice(true)
    try {
      const result = await confirmBookingVehiclePriceApi(selectedBooking.id, {
        vehicle_snapshot: vehicleSnapshot,
        customer_confirmed: true,
        reason: adjustmentReason.trim(),
      })
      setPriceReview(result.review)
      setClassificationVerified(true)
      void refreshBookings().catch(() => undefined)
      showToast('Đã ghi nhận khách xác nhận chênh lệch.', 'success')
    } catch (error) {
      setSubmitError(
        getApiErrorMessage(error, 'Không thể xác nhận chênh lệch giá.'),
      )
    } finally {
      setIsConfirmingPrice(false)
    }
  }

  const loadLateArrivalOptions = async () => {
    if (!lateArrival) return undefined
    setLateArrival((prev) =>
      prev ? { ...prev, isLoadingOptions: true, optionsError: null } : prev,
    )
    try {
      const data = await getLateArrivalOptions(lateArrival.booking.id)
      setLateArrival((prev) =>
        prev ? { ...prev, options: data, isLoadingOptions: false } : prev,
      )
      return data
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Không thể tải khung giờ gợi ý.',
      )
      setLateArrival((prev) =>
        prev
          ? { ...prev, isLoadingOptions: false, optionsError: message }
          : prev,
      )
      return undefined
    }
  }

  const handleResolveLate = async (
    resolution: LateArrivalResolution,
    payload?: { new_start_time?: string | null; note?: string },
  ): Promise<{ success: boolean; message: string }> => {
    if (!lateArrival) {
      return { success: false, message: 'Không xác định được booking.' }
    }
    const result = await resolveLateArrival(lateArrival.booking.id, {
      resolution,
      new_start_time: payload?.new_start_time ?? null,
      reason: 'LATE_ARRIVAL',
      note: payload?.note,
    })
    if (result.success) {
      showToast('Đã xử lý đến trễ. Check-in hoàn tất.', 'success')
      await refreshBookings()
      setLateArrival(null)
      setResults([])
      selectBooking(null)
      setHasSearched(false)
      setValue('query', '')
      if (searchParams.get('bookingId')) {
        setSearchParams({}, { replace: true })
      }
    }
    return { success: result.success, message: result.message }
  }

  const checkInGuard = selectedBooking
    ? getCheckInGuard(
        selectedBooking,
        session?.staffProfile.garage_id ?? undefined,
      )
    : { allowed: false, reason: 'Vui lòng chọn booking cần check-in.' }

  const verifiedCheckInGuard = classificationVerified
    ? checkInGuard
    : {
        allowed: false,
        reason: 'Cần xác minh phân loại xe thực tế trước khi check-in.',
      }

  const isSearching = isSubmitting || checkInSearch.isPending

  return (
    <div>
      <PageHeader
        title="Check-in"
        description="Tìm booking CONFIRMED qua GET /admin/bookings?status=CONFIRMED&search=..., sau đó PATCH /admin/bookings/{id}/check-in."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tìm booking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
              <div>
                <Label htmlFor="query" required>
                  Biển số hoặc SĐT
                </Label>
                <Input
                  id="query"
                  placeholder="30A-123.45 hoặc 0903000001"
                  error={errors.query?.message}
                  {...register('query')}
                />
              </div>

              <Button type="submit" fullWidth disabled={isSearching}>
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Đang tìm...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Tìm booking
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kết quả</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!hasSearched ? (
              <p className="text-sm text-slate-500">
                Nhập biển số hoặc SĐT rồi bấm Tìm để gọi API tìm booking CONFIRMED.
              </p>
            ) : results.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Không tìm thấy booking"
                description="Không có booking CONFIRMED nào khớp biển số hoặc SĐT đã nhập."
                compact
              />
            ) : (
              <div className="space-y-3">
                {results.map((booking) => (
                  <CheckInResultCard
                    key={booking.id}
                    booking={booking}
                    selected={selectedId === booking.id}
                    onSelect={() => selectBooking(booking)}
                  />
                ))}
              </div>
            )}

            {selectedBooking ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Booking đã chọn
                </p>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Khách</dt>
                    <dd className="font-medium text-slate-900">
                      {getBookingCustomerName(selectedBooking)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Giá</dt>
                    <dd className="font-medium text-slate-900">
                      {formatPrice(selectedBooking.final_price)}
                    </dd>
                  </div>
                </dl>

                {vehicleSnapshot ? (
                  <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-900">
                      Phân loại xe thực tế
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="checkin-engine" required>
                          Động cơ
                        </Label>
                        <Select
                          id="checkin-engine"
                          value={vehicleSnapshot.engine_type || ''}
                          onChange={(event) =>
                            updateVehicleSnapshot({
                              engine_type:
                                (event.target.value as 'GASOLINE' | 'ELECTRIC') ||
                                null,
                            })
                          }
                        >
                          <option value="">Chọn động cơ</option>
                          <option value="GASOLINE">Xăng</option>
                          <option value="ELECTRIC">Điện</option>
                        </Select>
                      </div>
                      {vehicleSnapshot.vehicle_type === 'CAR' ? (
                        <>
                          <div>
                            <Label htmlFor="checkin-body" required>
                              Kiểu dáng
                            </Label>
                            <Select
                              id="checkin-body"
                              value={vehicleSnapshot.car_body_type || ''}
                              onChange={(event) =>
                                updateVehicleSnapshot({
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
                            <Label htmlFor="checkin-seats" required>
                              Số chỗ
                            </Label>
                            <Input
                              id="checkin-seats"
                              type="number"
                              min={2}
                              max={16}
                              value={vehicleSnapshot.seat_count || ''}
                              onChange={(event) =>
                                updateVehicleSnapshot({
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
                          <Label htmlFor="checkin-cc" required>
                            Phân khối
                          </Label>
                          <Select
                            id="checkin-cc"
                            value={vehicleSnapshot.motorbike_cc_group || ''}
                            onChange={(event) =>
                              updateVehicleSnapshot({
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
                      fullWidth
                      disabled={isReviewingPrice}
                      onClick={handleReviewPrice}
                    >
                      {isReviewingPrice ? 'Đang kiểm tra...' : 'Kiểm tra phân loại và giá'}
                    </Button>

                    {priceReview?.requires_customer_confirmation ? (
                      <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="font-semibold text-amber-900">
                          Xe thực tế khác khai báo, cần khách xác nhận
                        </p>
                        <div className="grid gap-2 text-sm sm:grid-cols-2">
                          <span>
                            Giá cũ: {formatPrice(priceReview.previous_final_price)}
                          </span>
                          <span>
                            Giá mới: {formatPrice(priceReview.adjusted_final_price)}
                          </span>
                          <span>
                            Thời lượng cũ: {priceReview.previous_duration_minutes} phút
                          </span>
                          <span>
                            Thời lượng mới: {priceReview.adjusted_duration_minutes} phút
                          </span>
                        </div>
                        <Textarea
                          value={adjustmentReason}
                          onChange={(event) => setAdjustmentReason(event.target.value)}
                          placeholder="Lý do điều chỉnh phân loại"
                        />
                        <label className="flex items-start gap-2 text-sm text-amber-900">
                          <input
                            type="checkbox"
                            className="mt-1"
                            checked={customerConfirmed}
                            onChange={(event) =>
                              setCustomerConfirmed(event.target.checked)
                            }
                          />
                          Khách đã xem và đồng ý giá, thời lượng mới
                        </label>
                        <Button
                          fullWidth
                          disabled={
                            isConfirmingPrice ||
                            !customerConfirmed ||
                            adjustmentReason.trim().length < 3
                          }
                          onClick={handleConfirmPrice}
                        >
                          {isConfirmingPrice
                            ? 'Đang xác nhận...'
                            : 'Ghi nhận khách xác nhận'}
                        </Button>
                      </div>
                    ) : classificationVerified ? (
                      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
                        Đã xác minh phân loại xe và công suất phục vụ.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <GuardedActionButton
                  guard={verifiedCheckInGuard}
                  fullWidth
                  className="mt-4"
                  disabled={isCheckingIn}
                  onClick={handleCheckIn}
                >
                  {isCheckingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang check-in...
                    </>
                  ) : (
                    'Xác nhận Check-in'
                  )}
                </GuardedActionButton>
              </div>
            ) : null}

            {submitError ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {submitError}
              </p>
            ) : null}

            {successMessage ? (
              <div className="rounded-xl bg-green-50 px-4 py-4 text-sm text-green-700">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">{successMessage}</p>
                    <Link
                      to={
                        checkedInBookingId
                          ? `/bookings/${checkedInBookingId}`
                          : '/bookings'
                      }
                      className="mt-2 inline-flex items-center gap-1 text-green-800 hover:underline"
                    >
                      Xem chi tiết booking
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {lateArrival ? (
        <LateArrivalModal
          open={Boolean(lateArrival)}
          onClose={() => setLateArrival(null)}
          booking={lateArrival.booking}
          lateMinutes={lateArrival.minutes}
          options={lateArrival.options}
          isLoadingOptions={lateArrival.isLoadingOptions}
          loadError={lateArrival.optionsError}
          onReloadOptions={loadLateArrivalOptions}
          onResolve={handleResolveLate}
        />
      ) : null}
    </div>
  )
}
