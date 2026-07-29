/**
 * Workspace Booking Detail Page — hiển thị chi tiết booking dựa trên workspace API.
 *
 * Dùng cho VEHICLE_INSPECTION_STAFF và các staff type khác không có
 * BOOKING_READ_GARAGE capability (không thể gọi GET /admin/bookings/:id).
 *
 * Data sources:
 * - GET /staff/workspace/bookings/:id/workflow — workflow detail (timeline, milestones, actions)
 * - GET /staff/workspace/bookings — để lấy customer info (customer_name, phone, service_package, price)
 */

import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Bike,
  Car,
  Phone,
  ScanSearch,
  User,
} from 'lucide-react'
import { WORKFLOW_PHASE_LABELS } from '../../types/api/workspace'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { formatDateTime, formatPrice, formatTime } from '../../utils/format'
import {
  getApiErrorCode,
  getApiErrorMessage,
  getApiStatusCode,
} from '../../api/client'
import { useWorkspaceWorkflow } from '../../hooks/api/staff/useWorkspaceBookings'
import { useWorkspaceBookings } from '../../hooks/api/staff/useWorkspaceBookings'
import { WORKFLOW_PHASE_COLORS } from '../../components/service/WorkflowPhaseBanner'

/** Milestone step definitions cho timeline */
const WORKFLOW_STEPS = [
  { key: 'check_in', label: 'Check-in' },
  { key: 'before_wash_inspection', label: 'Kiểm tra trước rửa' },
  { key: 'service', label: 'Rửa xe' },
  { key: 'after_wash_inspection', label: 'Kiểm tra sau rửa' },
  { key: 'handover', label: 'Bàn giao' },
]

function getMilestoneStatus(
  milestone: unknown,
): 'DONE' | 'IN_PROGRESS' | 'PENDING' | 'NOT_READY' | 'BLOCKED' | 'READY' | undefined {
  if (!milestone || typeof milestone !== 'object') return undefined
  const m = milestone as { status?: string }
  if (!m.status) return undefined
  return m.status as 'DONE' | 'IN_PROGRESS' | 'PENDING' | 'NOT_READY' | 'BLOCKED' | 'READY'
}

function StepItem({
  label,
  status,
  index,
}: {
  label: string
  status: 'DONE' | 'IN_PROGRESS' | 'PENDING' | 'NOT_READY' | 'BLOCKED' | 'READY' | undefined
  index: number
}) {
  let bgClass = 'bg-slate-100 text-slate-400'
  let textColor = 'text-slate-400'
  let statusText = '—'

  if (status === 'DONE') {
    bgClass = 'bg-emerald-100 text-emerald-700'
    textColor = 'text-emerald-700'
    statusText = 'Hoàn thành'
  } else if (status === 'IN_PROGRESS') {
    bgClass = 'bg-indigo-100 text-indigo-700'
    textColor = 'text-indigo-700'
    statusText = 'Đang thực hiện'
  } else if (status === 'PENDING' || status === 'READY') {
    textColor = 'text-slate-500'
    statusText = 'Chờ'
  }

  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${bgClass}`}
      >
        {index + 1}
      </span>
      <span className={`flex-1 text-sm font-medium ${textColor}`}>{label}</span>
      <span className={`text-xs ${textColor}`}>{statusText}</span>
    </div>
  )
}

export function WorkspaceBookingDetailPage() {
  const { id } = useParams<{ id: string }>()

  // Lấy workflow detail từ BE
  const workflowQuery = useWorkspaceWorkflow(id ?? null)

  // Lấy customer info từ workspace bookings list (fetch tất cả để tìm booking by ID)
  const { data: bookingsData } = useWorkspaceBookings()

  // Tìm booking trong list để lấy customer info
  const workspaceBooking = bookingsData?.bookings.find(
    (b) => b.booking_id === id,
  )

  const booking = workflowQuery.data
  const VehicleIcon = booking?.vehicle_type === 'CAR' ? Car : Bike

  if (workflowQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
        Đang tải chi tiết booking...
      </div>
    )
  }

  if (workflowQuery.isError) {
    const status = getApiStatusCode(workflowQuery.error)
    const code = getApiErrorCode(workflowQuery.error)
    const isForbidden = status === 403
    const isNotFound = status === 404 || code === 'BOOKING_NOT_FOUND'

    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-red-600">
          {isForbidden
            ? 'Bạn không có quyền xem booking này'
            : isNotFound
              ? 'Không tìm thấy booking'
              : 'Không thể tải chi tiết booking'}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {getApiErrorMessage(
            workflowQuery.error,
            'Đã xảy ra lỗi khi tải dữ liệu workflow.',
          )}
        </p>
        <Link to="/bookings" className="mt-6">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không tìm thấy booking
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Booking này không tồn tại hoặc không thuộc garage của bạn.
        </p>
        <Link to="/bookings" className="mt-6">
          <Button variant="secondary">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách
          </Button>
        </Link>
      </div>
    )
  }

  const phaseColor = WORKFLOW_PHASE_COLORS[booking.workflow_phase]

  // Lấy customer info từ workspace booking (list) hoặc fallback
  const customerName = workspaceBooking?.customer_name || 'Khách vãng lai'
  const customerPhone = workspaceBooking?.customer_phone || ''
  const servicePackageName = workspaceBooking?.service_package_name || ''
  const finalPrice = workspaceBooking?.final_price ?? 0
  const earnedPoints = workspaceBooking?.earned_points ?? 0

  const hasInspectionAction =
    booking.available_actions.includes('inspection.before_wash.create') ||
    booking.available_actions.includes('inspection.after_wash.create')

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
        title={`Booking #${(id ?? '').slice(-8)}`}
        description={
          servicePackageName
            ? `${servicePackageName} · ${formatTime(booking.start_time)} — ${formatTime(booking.end_time)}`
            : `${formatTime(booking.start_time)} — ${formatTime(booking.end_time)}`
        }
        action={
          hasInspectionAction ? (
            <Link to={`/service/inspection?bookingId=${id}`}>
              <Button>
                <ScanSearch className="h-4 w-4" />
                Kiểm tra xe
              </Button>
            </Link>
          ) : undefined
        }
      />

      {/* Workflow Phase Badge */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${phaseColor.bg} ${phaseColor.text}`}
        >
          {WORKFLOW_PHASE_LABELS[booking.workflow_phase]}
        </span>
        {booking.booking_status && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {booking.booking_status}
          </span>
        )}
        {booking.blocked_by_incident && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
            Tạm dừng do sự cố
          </span>
        )}
      </div>

      {/* Workflow Timeline */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tiến trình xử lý</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {WORKFLOW_STEPS.map((step, index) => {
            const milestone = booking.milestones[step.key as keyof typeof booking.milestones]
            const status = getMilestoneStatus(milestone)

            return (
              <div key={step.key} className="flex items-center gap-3">
                {index > 0 && (
                  <div
                    className={`h-6 w-0.5 shrink-0 ${
                      status === 'DONE' ? 'bg-emerald-400' : 'bg-slate-200'
                    }`}
                  />
                )}
                <StepItem label={step.label} status={status} index={index} />
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Customer & Vehicle Info */}
      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900">{customerName}</p>
                <p className="text-sm text-slate-500">
                  {workspaceBooking ? 'Khách đăng ký' : 'Khách vãng lai'}
                </p>
              </div>
            </div>

            <dl className="grid gap-3 text-sm">
              {customerPhone ? (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-slate-400" />
                  <dt className="text-slate-500">SĐT:</dt>
                  <dd className="font-medium text-slate-900">{customerPhone}</dd>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <VehicleIcon className="h-4 w-4 text-slate-400" />
                <dt className="text-slate-500">Xe:</dt>
                <dd className="font-medium text-slate-900">
                  {booking.license_plate || '—'} ·{' '}
                  {booking.vehicle_type === 'CAR'
                    ? 'Ô tô'
                    : booking.vehicle_type === 'MOTORBIKE'
                      ? 'Xe máy'
                      : booking.vehicle_type}
                </dd>
              </div>

              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                <p className="text-slate-500">Giờ hẹn</p>
                <p className="mt-1 font-medium text-slate-900">
                  {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {formatDateTime(booking.start_time)}
                </p>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chi tiết dịch vụ</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-3 text-sm">
              {servicePackageName ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Gói dịch vụ</dt>
                  <dd className="font-medium text-slate-900">{servicePackageName}</dd>
                </div>
              ) : null}

              {finalPrice > 0 ? (
                <>
                  <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                    <dt className="font-medium text-slate-900">Thành tiền</dt>
                    <dd className="text-lg font-semibold text-brand-700">
                      {formatPrice(finalPrice)}
                    </dd>
                  </div>
                  {earnedPoints > 0 && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Điểm tích lũy</dt>
                      <dd className="font-medium text-amber-600">
                        +{earnedPoints} điểm
                      </dd>
                    </div>
                  )}
                </>
              ) : (
                <div className="rounded-xl bg-slate-50 px-4 py-3 text-center text-sm text-slate-500">
                  Chưa có thông tin giá
                </div>
              )}

              {booking.payment && (
                <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3">
                  <p className="text-slate-500">Thanh toán</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {booking.payment.method || '—'} ·{' '}
                    {booking.payment.status || '—'}
                  </p>
                </div>
              )}
            </dl>
          </CardContent>
        </Card>
      </div>

      {/* Available Actions */}
      {booking.available_actions.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Thao tác khả dụng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {booking.available_actions.map((action) => (
                <span
                  key={action}
                  className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700"
                >
                  {action}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Blockers */}
      {booking.blockers.length > 0 && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700">Các trở ngại</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-red-700">
              {booking.blockers.map((blocker) => (
                <li key={blocker}>{blocker}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
