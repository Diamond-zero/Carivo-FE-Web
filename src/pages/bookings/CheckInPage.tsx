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
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { GuardedActionButton } from '../../components/booking/GuardedActionButton'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Label } from '../../components/ui/Label'
import { useBookings } from '../../contexts/BookingContext'
import { getServicePackageName } from '../../mocks/servicePackages'
import type { Booking } from '../../types/booking'
import {
  getBookingCustomerName,
  getBookingPhone,
} from '../../utils/booking'
import { getCheckInGuard } from '../../utils/bookingActionGuards'
import { useAuth } from '../../contexts/AuthContext'
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
          ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-500/20'
          : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'
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
            {getServicePackageName(booking.service_package_id)} ·{' '}
            {formatTime(booking.start_time)}
          </p>
        </div>
        <BookingStatusBadge status={booking.status} />
      </div>
    </button>
  )
}

export function CheckInPage() {
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const { searchCheckInCandidates, checkInBooking, getBookingById } =
    useBookings()

  const [results, setResults] = useState<Booking[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [checkedInBookingId, setCheckedInBookingId] = useState<string | null>(
    null,
  )
  const [isCheckingIn, setIsCheckingIn] = useState(false)

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

    const booking = getBookingById(bookingId)
    if (!booking) return

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
  }, [searchParams, getBookingById, setValue])

  const onSearch = (data: SearchFormValues) => {
    setSubmitError(null)
    setSuccessMessage(null)
    const found = searchCheckInCandidates(data.query)
    setResults(found)
    setSelectedId(found.length === 1 ? found[0].id : null)
    setHasSearched(true)
  }

  const handleCheckIn = async () => {
    if (!selectedId) {
      setSubmitError('Vui lòng chọn booking cần check-in.')
      return
    }

    setSubmitError(null)
    setSuccessMessage(null)
    setIsCheckingIn(true)

    await new Promise((resolve) => setTimeout(resolve, 500))

    const result = checkInBooking(selectedId)
    setIsCheckingIn(false)

    if (!result.success) {
      setSubmitError(result.message)
      return
    }

    setSuccessMessage(result.message)
    setCheckedInBookingId(selectedId)
    setResults([])
    setSelectedId(null)
    setHasSearched(false)
    setValue('query', '')
  }

  const checkInGuard = selectedBooking
    ? getCheckInGuard(selectedBooking, session?.staffProfile.garage_id)
    : { allowed: false, reason: 'Vui lòng chọn booking cần check-in.' }

  return (
    <div>
      <PageHeader
        title="Check-in"
        description="Tìm booking theo biển số hoặc số điện thoại, sau đó xác nhận check-in."
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
                <p className="mt-1.5 text-xs text-slate-500">
                  Thử: <code className="text-slate-700">30A-123.45</code>,{' '}
                  <code className="text-slate-700">0903000001</code>
                </p>
              </div>

              <Button type="submit" fullWidth disabled={isSubmitting}>
                {isSubmitting ? (
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
                Nhập biển số hoặc SĐT rồi bấm Tìm để hiện booking khớp.
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
    </div>
  )
}
