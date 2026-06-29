import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Search,
  SearchX,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useSearchParams } from 'react-router-dom'
import { z } from 'zod'
import { getApiErrorMessage } from '../../api/client'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { GuardedActionButton } from '../../components/booking/GuardedActionButton'
import { LateArrivalModal } from '../../components/booking/LateArrivalModal'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { useToast } from '../../contexts/ToastContext'
import { useCheckInSearch } from '../../hooks/api/staff/useCheckInSearch'
import type { Booking } from '../../types/booking'
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

  const [results, setResults] = useState<Booking[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [checkedInBookingId, setCheckedInBookingId] = useState<string | null>(
    null,
  )
  const [isCheckingIn, setIsCheckingIn] = useState(false)
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

  useEffect(() => {
    const bookingId = searchParams.get('bookingId')
    if (!bookingId) return

    let cancelled = false

    async function loadBookingFromLink() {
      try {
        const cached = getBookingById(bookingId!)
        const booking =
          cached ??
          (await checkInSearch.mutateAsync(bookingId!)).find(
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
          setSelectedId(booking.id)
          setHasSearched(true)
          setValue('query', booking.license_plate)
          return
        }

        setSubmitError(
          'Booking này không ở trạng thái Đã xác nhận, không thể check-in.',
        )
        setValue('query', booking.license_plate)
      } catch (error) {
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
  }, [searchParams, getBookingById, setValue, checkInSearch])

  const onSearch = async (data: SearchFormValues) => {
    setSubmitError(null)
    setSuccessMessage(null)

    try {
      const found = await checkInSearch.mutateAsync(data.query)
      setResults(found)
      setSelectedId(found.length === 1 ? found[0].id : null)
      setHasSearched(true)
    } catch (error) {
      setResults([])
      setSelectedId(null)
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
    setSelectedId(null)
    setHasSearched(false)
    setValue('query', '')
    // Clear ?bookingId để tránh useEffect loadBookingFromLink chạy lại booking vừa check-in
    if (searchParams.get('bookingId')) {
      setSearchParams({}, { replace: true })
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
      setSelectedId(null)
      setHasSearched(false)
      setValue('query', '')
      if (searchParams.get('bookingId')) {
        setSearchParams({}, { replace: true })
      }
    }
    return { success: result.success, message: result.message }
  }

  const checkInGuard = selectedBooking
    ? getCheckInGuard(selectedBooking, session?.staffProfile.garage_id)
    : { allowed: false, reason: 'Vui lòng chọn booking cần check-in.' }

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
                    onSelect={() => setSelectedId(booking.id)}
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

                <GuardedActionButton
                  guard={checkInGuard}
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