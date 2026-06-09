import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  CheckCircle2,
  Info,
  Loader2,
  MapPin,
  Play,
  Wrench,
} from 'lucide-react'
import { AssignWashBayModal } from '../../components/wash-bay/AssignWashBayModal'
import { CompleteServiceModal } from '../../components/booking/CompleteServiceModal'
import { GuardedActionButton } from '../../components/booking/GuardedActionButton'
import { BookingExecutionDrawer } from '../../components/service/BookingExecutionDrawer'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { PageHeader } from '../../components/layout/PageHeader'
import { ServiceStepList } from '../../components/service/ServiceStepList'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
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
import { useToast } from '../../contexts/ToastContext'
import { getServicePackageName } from '../../mocks/servicePackages'
import {
  getBookingCustomerName,
} from '../../utils/booking'
import {
  getAssignWashBayGuard,
  getCompleteServiceGuard,
  getStartServiceGuard,
} from '../../utils/bookingActionGuards'
import {
  bookingRequiresWashBay,
} from '../../utils/washBay'
import { formatTime } from '../../utils/format'

export function ServiceExecutionPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { session } = useAuth()
  const { showToast } = useToast()
  const {
    bookings,
    getBookingById,
    getWashBayById,
    getAvailableWashBaysForBooking,
    assignWashBay,
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
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)

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

  const staffGarageId = session?.staffProfile.garage_id

  const assignWashBayGuard = booking
    ? getAssignWashBayGuard(booking, staffGarageId)
    : { allowed: false as const }
  const startServiceGuard = booking
    ? getStartServiceGuard(booking, staffGarageId)
    : { allowed: false as const }
  const completeServiceGuard = booking
    ? getCompleteServiceGuard(booking, steps, staffGarageId)
    : { allowed: false as const }

  const needsWashBayAssignment = assignWashBayGuard.allowed
  const assignedWashBay = booking?.wash_bay_id
    ? getWashBayById(booking.wash_bay_id)
    : undefined
  const availableWashBays = selectedBookingId
    ? getAvailableWashBaysForBooking(selectedBookingId)
    : []

  useEffect(() => {
    const paramId = searchParams.get('bookingId')
    if (!paramId && executableBookings[0]?.id) {
      setSearchParams({ bookingId: executableBookings[0].id }, { replace: true })
    }
  }, [executableBookings, searchParams, setSearchParams])

  useEffect(() => {
    setIsDetailDrawerOpen(false)
  }, [selectedBookingId])

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

    if (
      result.success &&
      booking &&
      !booking.wash_bay_id &&
      bookingRequiresWashBay(booking)
    ) {
      setIsAssignModalOpen(true)
    }
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

  const handleConfirmCompleteService = async () => {
    if (!selectedBookingId) {
      return { success: false, message: 'Không xác định được booking.' }
    }

    const result = completeService(selectedBookingId)

    if (result.success) {
      showToast(result.message, 'success')
      navigate(`/bookings/${selectedBookingId}`, {
        state: { openMarkPaid: true },
      })
    } else {
      setFeedback({ type: 'error', message: result.message })
    }

    return result
  }

  const handleAssignWashBay = async (washBayId: string) => {
    if (!selectedBookingId) {
      return { success: false, message: 'Không xác định được booking.' }
    }

    const result = assignWashBay(selectedBookingId, washBayId)
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    })
    return result
  }

  const handleRequestAssignFromDrawer = () => {
    setIsDetailDrawerOpen(false)
    setIsAssignModalOpen(true)
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
          <CardContent>
            <EmptyState
              icon={Wrench}
              title="Không có booking đang xử lý"
              description="Chỉ booking CHECKED_IN hoặc IN_PROGRESS mới hiển thị tại đây."
              action={
                <Link to="/bookings">
                  <Button variant="secondary">Xem danh sách booking</Button>
                </Link>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => setIsDetailDrawerOpen(true)}
                  >
                    <Info className="h-4 w-4" />
                    Chi tiết booking
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {booking?.status === 'CHECKED_IN' ? (
              <Card className="border-brand-200 bg-brand-50/50">
                <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-slate-900">
                      Booking đã check-in — sẵn sàng bắt đầu
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Bấm bắt đầu để tạo các bước dịch vụ và chuyển sang IN_PROGRESS.
                    </p>
                  </div>
                  <GuardedActionButton
                    guard={startServiceGuard}
                    showHint={false}
                    disabled={isStarting}
                    onClick={handleStartService}
                  >
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
                  </GuardedActionButton>
                </CardContent>
              </Card>
            ) : null}

            {booking?.status === 'IN_PROGRESS' ? (
              <>
                {needsWashBayAssignment ? (
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          Cần gán buồng rửa trước bước rửa tự động
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Hoàn thành bước kiểm tra xong, gán buồng{' '}
                          {booking.vehicle_type === 'CAR' ? 'ô tô' : 'xe máy'} đang trống
                          để mới bắt đầu và hoàn thành bước rửa tự động.
                        </p>
                      </div>
                      <GuardedActionButton
                        guard={assignWashBayGuard}
                        showHint={false}
                        onClick={() => setIsAssignModalOpen(true)}
                      >
                        <MapPin className="h-4 w-4" />
                        Gán buồng rửa
                      </GuardedActionButton>
                    </CardContent>
                  </Card>
                ) : assignedWashBay ? (
                  <Card className="border-brand-200 bg-brand-50/40">
                    <CardContent className="py-4">
                      <p className="text-sm text-slate-600">Buồng rửa đang sử dụng</p>
                      <p className="mt-1 font-medium text-slate-900">
                        {assignedWashBay.name} · {assignedWashBay.bay_code}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}

              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Các bước dịch vụ</CardTitle>
                    <CardDescription>
                      Hoàn thành lần lượt từng bước theo thứ tự
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsDetailDrawerOpen(true)}
                  >
                    <Info className="h-4 w-4" />
                    Chi tiết
                  </Button>
                </CardHeader>
                <CardContent>
                  <ServiceStepList
                    steps={steps}
                    booking={booking}
                    onCompleteStep={handleCompleteStep}
                    completingStepId={completingStepId}
                  />

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <GuardedActionButton
                      guard={completeServiceGuard}
                      fullWidth
                      variant="secondary"
                      hintClassName="text-center"
                      onClick={() => setIsCompleteModalOpen(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Hoàn thành dịch vụ
                    </GuardedActionButton>
                  </div>
                </CardContent>
              </Card>
              </>
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

      {booking && needsWashBayAssignment ? (
        <AssignWashBayModal
          open={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          booking={booking}
          availableBays={availableWashBays}
          onAssign={handleAssignWashBay}
        />
      ) : null}

      {booking ? (
        <CompleteServiceModal
          open={isCompleteModalOpen}
          onClose={() => setIsCompleteModalOpen(false)}
          booking={booking}
          onConfirm={handleConfirmCompleteService}
        />
      ) : null}

      {booking ? (
        <BookingExecutionDrawer
          open={isDetailDrawerOpen}
          onClose={() => setIsDetailDrawerOpen(false)}
          booking={booking}
          washBay={assignedWashBay}
          needsWashBayAssignment={needsWashBayAssignment}
          onRequestAssignWashBay={
            needsWashBayAssignment ? handleRequestAssignFromDrawer : undefined
          }
        />
      ) : null}
    </div>
  )
}
