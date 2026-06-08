import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Play,
} from 'lucide-react'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { PageHeader } from '../../components/layout/PageHeader'
import { ServiceStepList } from '../../components/service/ServiceStepList'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { useAuth } from '../../contexts/AuthContext'
import { useBookings } from '../../contexts/BookingContext'
import { getServicePackageName } from '../../mocks/servicePackages'
import {
  getBookingCustomerName,
} from '../../utils/booking'
import { areAllStepsDone } from '../../utils/serviceSteps'
import { formatTime } from '../../utils/format'

export function ServiceExecutionPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useAuth()
  const {
    bookings,
    getBookingById,
    getServiceStepsByBookingId,
    startService,
    completeServiceStep,
    completeService,
  } = useBookings()

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [completingStepId, setCompletingStepId] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isCompletingService, setIsCompletingService] = useState(false)

  const executableBookings = useMemo(
    () =>
      bookings.filter((booking) =>
        ['CHECKED_IN', 'IN_PROGRESS'].includes(booking.status),
      ),
    [bookings],
  )

  const selectedBookingId =
    searchParams.get('bookingId') ?? executableBookings[0]?.id ?? ''

  const booking = selectedBookingId
    ? getBookingById(selectedBookingId)
    : undefined

  const steps = selectedBookingId
    ? getServiceStepsByBookingId(selectedBookingId)
    : []

  const allStepsDone = areAllStepsDone(steps)

  useEffect(() => {
    const paramId = searchParams.get('bookingId')
    if (!paramId && executableBookings[0]?.id) {
      setSearchParams({ bookingId: executableBookings[0].id }, { replace: true })
    }
  }, [executableBookings, searchParams, setSearchParams])

  const handleSelectBooking = (bookingId: string) => {
    setSearchParams({ bookingId })
    setFeedback(null)
  }

  const handleStartService = async () => {
    if (!selectedBookingId) return

    setIsStarting(true)
    setFeedback(null)
    await new Promise((resolve) => setTimeout(resolve, 400))

    const result = startService(selectedBookingId)
    setIsStarting(false)
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    })
  }

  const handleCompleteStep = async (stepId: string) => {
    if (!session?.staffProfile.id) return

    setCompletingStepId(stepId)
    setFeedback(null)
    await new Promise((resolve) => setTimeout(resolve, 350))

    const result = completeServiceStep(stepId, session.staffProfile.id)
    setCompletingStepId(null)
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    })
  }

  const handleCompleteService = async () => {
    if (!selectedBookingId) return

    setIsCompletingService(true)
    setFeedback(null)
    await new Promise((resolve) => setTimeout(resolve, 500))

    const result = completeService(selectedBookingId)
    setIsCompletingService(false)
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    })

    if (result.success) {
      navigate(`/bookings/${selectedBookingId}`)
    }
  }

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>

      <PageHeader
        title="Thực hiện dịch vụ"
        description="Xác nhận từng bước dịch vụ cho booking đang xử lý tại garage."
      />

      {executableBookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-500">
            Không có booking CHECKED_IN hoặc IN_PROGRESS để thực hiện.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[320px_1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Chọn booking</CardTitle>
              <CardDescription>
                {executableBookings.length} booking đang chờ xử lý
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                value={selectedBookingId}
                onChange={(event) => handleSelectBooking(event.target.value)}
              >
                {executableBookings.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.id.replace('booking-', '#')} · {item.license_plate}
                  </option>
                ))}
              </Select>

              {booking ? (
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p className="font-medium text-slate-900">
                    {getBookingCustomerName(booking)}
                  </p>
                  <p className="mt-1 text-slate-600">{booking.license_plate}</p>
                  <p className="mt-1 text-slate-500">
                    {getServicePackageName(booking.service_package_id)}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {formatTime(booking.start_time)}
                  </p>
                  <div className="mt-3">
                    <BookingStatusBadge status={booking.status} />
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {booking?.status === 'CHECKED_IN' ? (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      Booking đã check-in — sẵn sàng bắt đầu
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Bấm bắt đầu để tạo các bước dịch vụ và chuyển sang IN_PROGRESS.
                    </p>
                  </div>
                  <Button onClick={handleStartService} disabled={isStarting}>
                    {isStarting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang bắt đầu...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Bắt đầu dịch vụ
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ) : null}

            {booking?.status === 'IN_PROGRESS' ? (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Các bước dịch vụ</CardTitle>
                    <CardDescription>
                      Hoàn thành lần lượt từng bước theo thứ tự
                    </CardDescription>
                  </div>
                  <Link to={`/bookings/${booking.id}`}>
                    <Button variant="ghost" size="sm">
                      Chi tiết
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <ServiceStepList
                    steps={steps}
                    onCompleteStep={handleCompleteStep}
                    completingStepId={completingStepId}
                  />

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <Button
                      fullWidth
                      variant="secondary"
                      disabled={!allStepsDone || isCompletingService}
                      onClick={handleCompleteService}
                    >
                      {isCompletingService ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Đang hoàn thành dịch vụ...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Hoàn thành dịch vụ
                        </>
                      )}
                    </Button>
                    {!allStepsDone ? (
                      <p className="mt-2 text-center text-xs text-slate-500">
                        Hoàn thành tất cả bước để kích hoạt nút này
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {feedback ? (
              <p
                className={`rounded-xl px-4 py-3 text-sm ${
                  feedback.type === 'success'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-600'
                }`}
              >
                {feedback.message}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
