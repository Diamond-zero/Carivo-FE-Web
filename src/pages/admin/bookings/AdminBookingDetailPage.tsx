import { useEffect, useMemo } from 'react'
import {
  ArrowLeft,
  Bike,
  CalendarDays,
  Car,
  CheckCircle2,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { AdminBookingStatusPanel } from '../../../components/admin/booking/AdminBookingStatusPanel'
import { ArrivalStatusBadge } from '../../../components/booking/ArrivalStatusBadge'
import { BookingStatusBadge } from '../../../components/booking/BookingStatusBadge'
import { BookingTimeline } from '../../../components/booking/BookingTimeline'
import { PaymentStatusBadge } from '../../../components/booking/PaymentStatusBadge'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminBookingDetail,
  useAdminBookingMutations,
} from '../../../hooks/api/admin/useAdminBookings'
import type { BookingStatus } from '../../../types/booking'
import type { ApiBookingItem } from '../../../types/api/staff'
import {
  getAdminBookingArrivalStatus,
  getAdminBookingCustomerName,
  getAdminBookingExceptionReason,
  getAdminBookingGraceExceeded,
  getAdminBookingLateMinutes,
  getAdminBookingPhone,
} from '../../../utils/adminBooking'
import { formatDateTime, formatPrice, formatTime } from '../../../utils/format'

export function AdminBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { showToast } = useToast()
  const { data: booking, isLoading, isError, error } = useAdminBookingDetail(bookingId)
  const { cancelMutation, markPaidMutation, payosMutation, reopenServiceMutation } =
    useAdminBookingMutations(bookingId)

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được chi tiết booking.'), 'error')
    }
  }, [isError, error, showToast])

  const bookingItems = useMemo<ApiBookingItem[]>(
    () => booking?.raw?.booking_items ?? [],
    [booking?.raw?.booking_items],
  )
  const isCombo = booking?.raw?.service_package?.service_type === 'COMBO'

  const statusEvents = useMemo(() => {
    if (!booking) return [] as Array<{ key: string; label: string; at: string | null }>
    const raw = booking.raw
    return [
      { key: 'created', label: 'Tạo booking', at: raw?.created_at ?? null },
      { key: 'checked_in', label: 'Check-in', at: booking.raw?.checked_in_at ?? null },
      { key: 'started', label: 'Bắt đầu dịch vụ', at: booking.raw?.started_at ?? null },
      { key: 'completed', label: 'Hoàn thành dịch vụ', at: booking.raw?.completed_at ?? null },
      { key: 'paid', label: 'Thanh toán', at: booking.raw?.paid_at ?? null },
      { key: 'canceled', label: 'Huỷ booking', at: booking.raw?.canceled_at ?? null },
      { key: 'no_show', label: 'No-show', at: booking.raw?.no_show_at ?? null },
      { key: 'rescheduled', label: 'Dời lịch', at: booking.raw?.rescheduled_at ?? null },
    ].filter((event) => Boolean(event.at))
  }, [booking])

  const arrivalStatus = booking ? getAdminBookingArrivalStatus(booking) : null
  const lateMinutes = booking ? getAdminBookingLateMinutes(booking) : 0
  const graceExceeded = booking ? getAdminBookingGraceExceeded(booking) : 0
  const exceptionReason = booking ? getAdminBookingExceptionReason(booking) : null
  const referenceStart = booking?.raw?.arrival_reference_start_time ?? null

  if (!isLoading && !booking) {
    return (
      <div>
        <PageHeader
          title="Không tìm thấy booking"
          description="Mã booking không tồn tại trong hệ thống."
          action={
            <Link to="/admin/bookings">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại danh sách
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={CalendarDays}
          title="Booking không tồn tại"
          description="Mã booking không khớp với dữ liệu hệ thống."
          action={
            <Link to="/admin/bookings">
              <Button>Về danh sách booking</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const VehicleIcon = booking?.vehicle_type === 'CAR' ? Car : Bike

  const handleUpdateStatus = async (_status: BookingStatus) => {
    return {
      ok: false,
      message: 'Cập nhật trạng thái thủ công chưa được hỗ trợ qua API.',
    }
  }

  const handleMarkPaid = async () => {
    if (!bookingId) {
      return { ok: false, message: 'Không xác định được booking.' }
    }

    try {
      await markPaidMutation.mutateAsync()
      showToast('Đã đánh dấu thanh toán.', 'success')
      return { ok: true, message: '' }
    } catch (mutationError) {
      return {
        ok: false,
        message: getApiErrorMessage(mutationError, 'Không thể đánh dấu thanh toán.'),
      }
    }
  }

  const handleMarkPaidPayos = async () => {
    if (!bookingId) {
      return { ok: false, message: 'Không xác định được booking.' }
    }

    try {
      const result = await payosMutation.mutateAsync()
      const checkoutUrl = result.payment.checkout_url
      showToast('Đã tạo link thanh toán PayOS.', 'success')
      return { ok: true, message: '', checkoutUrl }
    } catch (mutationError) {
      return {
        ok: false,
        message: getApiErrorMessage(mutationError, 'Không tạo được thanh toán PayOS.'),
      }
    }
  }

  const handleReopenService = async () => {
    if (!bookingId) {
      return { ok: false, message: 'Không xác định được booking.' }
    }

    try {
      await reopenServiceMutation.mutateAsync(undefined)
      showToast('Đã mở lại dịch vụ cho booking.', 'success')
      return { ok: true, message: '' }
    } catch (mutationError) {
      return {
        ok: false,
        message: getApiErrorMessage(
          mutationError,
          'Không thể mở lại dịch vụ. Booking có thể đã thanh toán hoặc đã cộng điểm.',
        ),
      }
    }
  }

  const handleCancel = async () => {
    if (!bookingId) {
      return { ok: false, message: 'Không xác định được booking.' }
    }

    try {
      await cancelMutation.mutateAsync()
      showToast('Đã hủy booking.', 'success')
      return { ok: true, message: '' }
    } catch (mutationError) {
      return {
        ok: false,
        message: getApiErrorMessage(mutationError, 'Không thể hủy booking.'),
      }
    }
  }

  return (
    <div>
      {isLoading || !booking ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Quản trị"
            title={`Booking ${booking.id.replace('booking-', 'BK-')}`}
            description={`${booking.service_package_name ?? booking.service_package_id} · ${booking.garage_id}`}
            action={
              <Link to="/admin/bookings">
                <Button variant="secondary">
                  <ArrowLeft className="h-4 w-4" />
                  Danh sách booking
                </Button>
              </Link>
            }
          />

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <BookingStatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.payment_status} />
            {booking.is_walk_in ? (
              <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                Vãng lai
              </span>
            ) : null}
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-base">Can thiệp trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                <AdminBookingStatusPanel
                  key={`${booking.id}-${booking.status}-${booking.payment_status}`}
                  booking={booking}
                  onUpdateStatus={handleUpdateStatus}
                  onMarkPaid={handleMarkPaid}
                  onMarkPaidPayos={handleMarkPaidPayos}
                  onReopenService={handleReopenService}
                  onCancel={handleCancel}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tiến trình</CardTitle>
              </CardHeader>
              <CardContent>
                <BookingTimeline booking={booking} />
              </CardContent>
            </Card>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin khách & xe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">
                      {getAdminBookingCustomerName(booking)}
                    </p>
                    <p className="text-sm text-slate-500">
                      {booking.is_walk_in ? 'Khách vãng lai' : 'Khách đăng ký'}
                    </p>
                  </div>
                </div>

                <dl className="grid gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-slate-400" />
                    <dt className="text-slate-500">SĐT:</dt>
                    <dd className="font-medium text-slate-900">
                      {getAdminBookingPhone(booking) || '—'}
                    </dd>
                  </div>

                  {booking.guest_email ? (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <dt className="text-slate-500">Email:</dt>
                      <dd className="font-medium text-slate-900">{booking.guest_email}</dd>
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <VehicleIcon className="h-4 w-4 text-slate-400" />
                    <dt className="text-slate-500">Xe:</dt>
                    <dd className="font-medium text-slate-900">
                      {booking.license_plate} · {VEHICLE_TYPE_LABELS[booking.vehicle_type]}
                    </dd>
                  </div>
                </dl>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
                  <p className="text-slate-500">Giờ hẹn</p>
                  <p className="mt-1 font-medium text-slate-900">
                    {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {formatDateTime(booking.start_time)}
                  </p>
                </div>

                {booking.note ? (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    <p className="font-medium">Ghi chú</p>
                    <p className="mt-1">{booking.note}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chi tiết giá</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Giá gốc</dt>
                      <dd className="font-medium text-slate-900">
                        {formatPrice(booking.original_price)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Giảm giá</dt>
                      <dd className="font-medium text-red-600">
                        -{formatPrice(booking.discount_amount)}
                      </dd>
                    </div>
                    <div className="border-t border-slate-100 pt-3">
                      <div className="flex justify-between gap-4">
                        <dt className="font-medium text-slate-900">Thành tiền</dt>
                        <dd className="text-lg font-semibold text-brand-700">
                          {formatPrice(booking.final_price)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Buồng rửa</CardTitle>
                </CardHeader>
                <CardContent>
                  {booking.wash_bay_name ? (
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <p className="font-medium text-slate-900">{booking.wash_bay_name}</p>
                      <p className="text-sm text-slate-600">
                        {booking.wash_bay_code} · {VEHICLE_TYPE_LABELS[booking.vehicle_type]}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Chưa gán buồng rửa</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Thông tin đến xe</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {arrivalStatus ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Trạng thái:</span>
                    <ArrivalStatusBadge status={arrivalStatus} />
                    {lateMinutes > 0 ? (
                      <span className="text-xs text-orange-600">
                        trễ {lateMinutes} phút
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="text-slate-500">Chưa check-in.</p>
                )}

                {referenceStart ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Giờ tham chiếu:</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(referenceStart)}
                    </span>
                  </div>
                ) : null}

                {booking.raw?.arrived_at ? (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Thời điểm đến:</span>
                    <span className="font-medium text-slate-900">
                      {formatDateTime(booking.raw.arrived_at)}
                    </span>
                  </div>
                ) : null}

                {graceExceeded > 0 ? (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">
                    Vượt grace {graceExceeded} phút — cần xử lý đến muộn.
                  </div>
                ) : null}

                {booking.raw?.late_resolution ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    Đã xử lý đến muộn: {booking.raw.late_resolution}
                    {booking.raw.late_resolution_note
                      ? ` — ${booking.raw.late_resolution_note}`
                      : null}
                  </div>
                ) : null}

                {booking.raw?.rescheduled_at ? (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                    Đã dời lịch {formatDateTime(booking.raw.rescheduled_at)}
                    {booking.raw.reschedule_reason
                      ? ` — Lý do: ${booking.raw.reschedule_reason}`
                      : null}
                    {typeof booking.raw.reschedule_count === 'number' &&
                    booking.raw.reschedule_count > 0 ? (
                      <span className="ml-1">({booking.raw.reschedule_count} lần)</span>
                    ) : null}
                  </div>
                ) : null}

                {exceptionReason ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-red-700">
                    Lý do: {exceptionReason}
                  </div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Lịch sử trạng thái</CardTitle>
              </CardHeader>
              <CardContent>
                {statusEvents.length === 0 ? (
                  <p className="text-sm text-slate-500">Chưa có sự kiện nào.</p>
                ) : (
                  <ol className="space-y-3 text-sm">
                    {statusEvents.map((event) => (
                      <li
                        key={event.key}
                        className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-600" />
                        <span className="font-medium text-slate-900">{event.label}</span>
                        <span className="ml-auto text-xs text-slate-500">
                          {event.at ? formatDateTime(event.at) : '—'}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
          </div>

          {isCombo && bookingItems.length > 0 ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Hướng dẫn thực hiện (COMBO)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {bookingItems
                  .slice()
                  .sort((a, b) => a.sequence - b.sequence)
                  .map((item) => (
                    <div
                      key={item.item_key}
                      className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2"
                    >
                      <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-700">
                        {item.sequence}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900">
                          {item.name_snapshot}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTime(item.item_start_time)} — {formatTime(item.item_end_time)} ·{' '}
                          {item.duration_minutes} phút · nguồn {item.source}
                        </p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {item.status}
                      </span>
                    </div>
                  ))}
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
