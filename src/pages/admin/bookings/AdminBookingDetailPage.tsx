import {
  ArrowLeft,
  Bike,
  CalendarDays,
  Car,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AdminBookingStatusPanel } from '../../../components/admin/booking/AdminBookingStatusPanel'
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
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import {
  getAdminGarageName,
  getAdminServicePackageName,
  getAdminWashBayById,
} from '../../../mocks/admin'
import {
  cancelAdminBooking,
  getAdminBookingById,
  markAdminBookingPaid,
  updateAdminBookingStatus,
} from '../../../mocks/admin/adminBookingStore'
import type { BookingStatus } from '../../../types/booking'
import {
  getAdminBookingCustomerName,
  getAdminBookingPhone,
} from '../../../utils/adminBooking'
import { formatDateTime, formatPrice, formatTime } from '../../../utils/format'

export function AdminBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { showToast } = useToast()
  const isLoading = useInitialPageSkeleton(240)
  const [refreshKey, setRefreshKey] = useState(0)

  const booking = useMemo(
    () => (bookingId ? getAdminBookingById(bookingId) : undefined),
    [bookingId, refreshKey],
  )

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
          description="Mã booking không khớp với dữ liệu mock Admin."
          action={
            <Link to="/admin/bookings">
              <Button>Về danh sách booking</Button>
            </Link>
          }
        />
      </div>
    )
  }

  const washBay = booking?.wash_bay_id
    ? getAdminWashBayById(booking.wash_bay_id)
    : null
  const VehicleIcon = booking?.vehicle_type === 'CAR' ? Car : Bike

  const bumpRefresh = () => setRefreshKey((value) => value + 1)

  const handleUpdateStatus = async (status: BookingStatus) => {
    if (!bookingId) {
      return { ok: false, message: 'Không xác định được booking.' }
    }

    const result = updateAdminBookingStatus(bookingId, status)
    if (result.ok) {
      bumpRefresh()
      showToast(`Đã cập nhật trạng thái: ${status}.`, 'success')
      return { ok: true, message: '' }
    }

    return { ok: false, message: result.message }
  }

  const handleMarkPaid = async () => {
    if (!bookingId) {
      return { ok: false, message: 'Không xác định được booking.' }
    }

    const result = markAdminBookingPaid(bookingId)
    if (result.ok) {
      bumpRefresh()
      showToast('Đã đánh dấu thanh toán.', 'success')
      return { ok: true, message: '' }
    }

    return { ok: false, message: result.message }
  }

  const handleCancel = async () => {
    if (!bookingId) {
      return { ok: false, message: 'Không xác định được booking.' }
    }

    const result = cancelAdminBooking(bookingId)
    if (result.ok) {
      bumpRefresh()
      showToast('Đã hủy booking.', 'success')
      return { ok: true, message: '' }
    }

    return { ok: false, message: result.message }
  }

  return (
    <div>
      {isLoading || !booking ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Admin"
            title={`Booking ${booking.id.replace('booking-', 'BK-')}`}
            description={`${getAdminServicePackageName(booking.service_package_id)} · ${getAdminGarageName(booking.garage_id)}`}
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
                Walk-in
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
                  key={`${booking.id}-${booking.status}-${booking.payment_status}-${refreshKey}`}
                  booking={booking}
                  onUpdateStatus={handleUpdateStatus}
                  onMarkPaid={handleMarkPaid}
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
                  {washBay ? (
                    <div className="rounded-xl bg-brand-50 px-4 py-3">
                      <p className="font-medium text-slate-900">{washBay.name}</p>
                      <p className="text-sm text-slate-600">
                        {washBay.bay_code} · {VEHICLE_TYPE_LABELS[washBay.vehicle_type]}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">Chưa gán buồng rửa</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
