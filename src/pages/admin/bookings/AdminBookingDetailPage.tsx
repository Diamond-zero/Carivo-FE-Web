import { useEffect } from 'react'
import {
  ArrowLeft,
  Bike,
  CalendarDays,
  Car,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
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
import {
  useAdminBookingDetail,
  useAdminBookingMutations,
} from '../../../hooks/api/admin/useAdminBookings'
import type { BookingStatus } from '../../../types/booking'
import {
  getAdminBookingCustomerName,
  getAdminBookingPhone,
} from '../../../utils/adminBooking'
import { formatDateTime, formatPrice, formatTime } from '../../../utils/format'

export function AdminBookingDetailPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const { showToast } = useToast()
  const { data: booking, isLoading, isError, error } = useAdminBookingDetail(bookingId)
  const { cancelMutation, markPaidMutation, payosMutation } = useAdminBookingMutations(bookingId)

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được chi tiết booking.'), 'error')
    }
  }, [isError, error, showToast])

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
      const payment = await payosMutation.mutateAsync()
      const checkoutUrl = payment.checkout_url
      showToast('Đã tạo link thanh toán PayOS.', 'success')
      return { ok: true, message: '', checkoutUrl }
    } catch (mutationError) {
      return {
        ok: false,
        message: getApiErrorMessage(mutationError, 'Không tạo được thanh toán PayOS.'),
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
        </>
      )}
    </div>
  )
}
