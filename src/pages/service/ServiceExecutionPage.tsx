import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Info, Loader2, MapPin, Play, Wrench } from 'lucide-react'
import { AssignWashBayModal } from '../../components/wash-bay/AssignWashBayModal'
import { ArrivalStatusBadge } from '../../components/booking/ArrivalStatusBadge'
import { CompleteServiceModal } from '../../components/booking/CompleteServiceModal'
import { GuardedActionButton } from '../../components/booking/GuardedActionButton'
import { BookingExecutionDrawer } from '../../components/service/BookingExecutionDrawer'
import { ServiceItemList } from '../../components/service/ServiceItemList'
import { WorkflowPhaseBanner } from '../../components/service/WorkflowPhaseBanner'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { PageHeader } from '../../components/layout/PageHeader'
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
import { useMyCapabilities } from '../../hooks/api/staff/useStaffCapabilities'
import { useStaffTaskWorkflow } from '../../hooks/api/staff/useStaffTasks'
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
  const staffCapabilities = useMyCapabilities()
  const {
    bookings,
    getBookingById,
    getWashBayById,
    getAvailableWashBaysForBooking,
    fetchAvailableWashBaysForBooking,
    assignWashBay,
    getServicePackageName,
    startService,
    completeService,
  } = useBookings()

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)

  const canStartService = staffCapabilities.includes('booking.service.start')
  const hasAnyExecutionCap =
    staffCapabilities.includes('service_task.wash.execute_assigned') ||
    staffCapabilities.includes('service_task.care.execute_assigned')
  // Customer Service Staff không thuộc execution group nhưng vẫn cần truy cập
  // trang này để theo dõi IN_PROGRESS (qua `booking.service.read_garage`).
  const canReadService = staffCapabilities.includes(
    'booking.service.read_garage',
  )

  const executableBookings = useMemo(() => {
    // Phân quyền hiển thị theo capability:
    //  - Staff có `booking.service.start` (CUSTOMER_SERVICE_STAFF) → thấy cả
    //    CHECKED_IN (để bấm Bắt đầu) lẫn IN_PROGRESS (để theo dõi/complete).
    //  - Staff chỉ có wash/care capability → KHÔNG thấy CHECKED_IN (vì BE không
    //    cấp `booking.service.start` → bấm sẽ 403). Họ chỉ thấy booking
    //    IN_PROGRESS mà BE đã phân công.
    //  - Staff chỉ có `booking.service.read_garage` (theo dõi) → cũng thấy
    //    IN_PROGRESS nhưng KHÔNG thấy CHECKED_IN (vì không thể bắt đầu).
    return bookings.filter((booking) => {
      if (booking.status === 'CHECKED_IN') {
        return canStartService
      }
      if (booking.status === 'IN_PROGRESS') {
        return canStartService || hasAnyExecutionCap || canReadService
      }
      return false
    })
  }, [bookings, canStartService, hasAnyExecutionCap, canReadService])

  const selectedBookingId =
    searchParams.get('bookingId') ?? executableBookings[0]?.id ?? ''

  const booking = selectedBookingId
    ? getBookingById(selectedBookingId)
    : undefined

  // Workflow chi tiết từ `GET /staff/workspace/bookings/:id/workflow` — single
  // source of truth cho service items (countdown, status, pause/resume…) +
  // available_actions. Polling mỗi 5s để giữ countdown + status luôn đồng bộ
  // với BE (trước đó staff bị "mất trang" vì không có auto-refetch).
  const workflowQuery = useStaffTaskWorkflow(
    selectedBookingId || null,
    {
      enabled: Boolean(selectedBookingId) && booking?.status === 'IN_PROGRESS',
      refetchInterval: booking?.status === 'IN_PROGRESS' ? 5_000 : false,
    },
  )
  const workflow = workflowQuery.data

  // Derive `BookingServiceStep[]` (shape cũ) từ workflow.service_items để
  // `getCompleteServiceGuard` vẫn dùng được. Khi workflow chưa sẵn sàng
  // (vd booking vừa start) → mảng rỗng → guard sẽ từ chối (đúng hành vi).
  const steps = useMemo(() => {
    if (!workflow) return []
    return workflow.service_items.map((item) => ({
      id: item.item_key,
      booking_id: workflow.booking_id,
      step_code: item.item_key,
      step_name: item.name,
      order: item.sequence,
      step_type: item.transition_mode === 'AUTO' ? 'AUTOMATED_WASH_STEP' : 'MANUAL_SERVICE_STEP',
      display_staff_type: item.requires_care_staff ? 'VEHICLE_CARE_STAFF' : 'WASH_OPERATOR',
      assigned_staff_id: null,
      confirmed_by_staff_id: null,
      status:
        item.status === 'DONE' || item.status === 'SKIPPED'
          ? item.status
          : item.status === 'IN_PROGRESS' || item.status === 'AWAITING_CONFIRMATION'
            ? 'IN_PROGRESS'
            : item.status === 'PAUSED'
              ? 'IN_PROGRESS'
              : 'PENDING',
      instructions: [],
      started_at: item.actual_started_at,
      completed_at: item.actual_completed_at,
    }))
  }, [workflow])

  // `available_actions` từ workflow là single source of truth (BE đã check
  // đầy đủ capability + assignment + blockers). Nếu workflow chưa sẵn sàng
  // (vd booking CHECKED_IN trước khi start) → mảng rỗng, fallback guard.
  const availableActions = workflow?.available_actions ?? []
  const canCompleteServiceViaWorkflow =
    availableActions.includes('booking.service.complete')

  const staffGarageId = session?.staffProfile.garage_id

  const assignWashBayGuard = booking
    ? getAssignWashBayGuard(booking, staffGarageId)
    : { allowed: false as const }
  const startServiceGuard = booking
    ? getStartServiceGuard(booking, staffGarageId, staffCapabilities)
    : { allowed: false as const }
  const completeServiceGuard = booking
    ? getCompleteServiceGuard(booking, steps, staffGarageId, session?.staffProfile.id)
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
    const isEarly =
      booking?.raw?.arrival_status === 'EARLY'
    const result = await startService(
      selectedBookingId,
      undefined,
      isEarly ? true : undefined,
    )
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
      openAssignModal()
    }
  }

  const handleConfirmCompleteService = async () => {
    if (!selectedBookingId) {
      return { success: false, message: 'Không xác định được booking.' }
    }

    const result = await completeService(selectedBookingId)

    if (result.success) {
      showToast(result.message, 'success')
      // Flow BE mới: booking COMPLETED → staff chuẩn bị bàn giao (Bước 2)
      // → khách (hoặc walk-in staff) accept → staff thu tiền → staff release.
      // Điều hướng thẳng sang trang handover thay vì dừng ở booking detail
      // và mở MarkPaidModal (pay đã chuyển xuống sau khi khách accept).
      navigate(`/staff/handover/${selectedBookingId}`)
    } else {
      setFeedback({ type: 'error', message: result.message })
    }

    return result
  }

  const handleAssignWashBay = async (washBayId: string) => {
    if (!selectedBookingId) {
      return { success: false, message: 'Không xác định được booking.' }
    }

    const result = await assignWashBay(selectedBookingId, washBayId)
    setFeedback({
      type: result.success ? 'success' : 'error',
      message: result.message,
    })
    return result
  }

  const handleRequestAssignFromDrawer = () => {
    setIsDetailDrawerOpen(false)
    openAssignModal()
  }

  const openAssignModal = () => {
    if (selectedBookingId) {
      void fetchAvailableWashBaysForBooking(selectedBookingId)
    }
    setIsAssignModalOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          to="/bookings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
        <span className="text-xs text-slate-500">
          Bước tiến hành · {executableBookings.length} booking đang chờ
        </span>
      </div>

      <PageHeader
        title="Thực hiện dịch vụ"
        description={
          canStartService
            ? 'Xác nhận từng bước dịch vụ cho booking đang xử lý tại garage.'
            : 'Thực hiện các bước dịch vụ (rửa / chăm sóc xe) cho booking đã bắt đầu.'
        }
      />

      {executableBookings.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={Wrench}
              title="Không có booking đang chờ"
              description={
                canStartService
                  ? 'Chỉ booking CHECKED_IN hoặc IN_PROGRESS mới hiển thị tại đây.'
                  : 'Bạn chỉ thấy booking IN_PROGRESS đã được phân công. Khi Customer Service Staff bắt đầu dịch vụ, bạn sẽ nhận được booking tại đây.'
              }
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
                    {getServicePackageName(booking.service_package_id, booking.service_package_name)}
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        Booking đã check-in — sẵn sàng bắt đầu
                      </p>
                      <ArrivalStatusBadge status={booking.raw?.arrival_status} />
                    </div>
                    {booking.raw?.arrival_status === 'EARLY' ? (
                      <p className="mt-1 text-sm text-blue-600">
                        Khách đến sớm hơn lịch. Bạn có thể bắt đầu ngay hoặc đợi đến giờ đã đặt.
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-600">
                        Bấm bắt đầu để tạo các bước dịch vụ và chuyển sang IN_PROGRESS.
                      </p>
                    )}
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
                        onClick={openAssignModal}
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
                      Theo dõi tiến trình, tạm dừng / hoàn thành sớm / báo sự cố
                      cho từng hạng mục.
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
                  {workflow ? (
                    <WorkflowPhaseBanner
                      workflow={workflow}
                      workflowPhase={workflow.workflow_phase}
                      blockers={workflow.blockers}
                      availableActions={workflow.available_actions}
                      bookingId={selectedBookingId}
                      className="mb-4"
                    />
                  ) : null}

                  <ServiceItemList
                    bookingId={selectedBookingId}
                    workflow={workflow}
                    bookingItems={
                      (booking?.raw as { booking_items?: typeof import('../../types/api/staff').ApiBookingItem } | undefined)
                        ?.booking_items ?? []
                    }
                    washBays={availableWashBays}
                  />

                  <div className="mt-6 border-t border-slate-100 pt-6">
                    <GuardedActionButton
                      guard={
                        canCompleteServiceViaWorkflow
                          ? { allowed: true }
                          : completeServiceGuard
                      }
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
