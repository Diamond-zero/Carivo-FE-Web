import {
  ArrowLeft,
  Car,
  Bike,
  Mail,
  Phone,
  User,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { BookingServiceStepSummary } from '../../components/booking/BookingServiceStepSummary'
import { BookingStatusBadge } from '../../components/booking/BookingStatusBadge'
import { BookingTimeline } from '../../components/booking/BookingTimeline'
import { PaymentStatusBadge } from '../../components/booking/PaymentStatusBadge'
import { PageHeader } from '../../components/layout/PageHeader'
import { Button } from '../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../components/ui/Card'
import { VEHICLE_TYPE_LABELS } from '../../constants/washBayStatus'
import { getServicePackageName } from '../../mocks/servicePackages'
import { mockWashBays } from '../../mocks/washBays'
import {
  getBookingAction,
  getBookingById,
  getBookingCustomerName,
  getBookingPhone,
  getServiceStepsByBookingId,
} from '../../utils/booking'
import { formatDateTime, formatPrice, formatTime } from '../../utils/format'

export function BookingDetailPage() {
  const { id } = useParams()
  const booking = id ? getBookingById(id) : undefined

  if (!booking) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <h1 className="text-xl font-semibold text-slate-900">
          Không tìm thấy booking
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Mã booking không tồn tại trong hệ thống mock.
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

  const action = getBookingAction(booking)
  const serviceSteps = getServiceStepsByBookingId(booking.id)
  const washBay = booking.wash_bay_id
    ? mockWashBays.find((bay) => bay.id === booking.wash_bay_id)
    : null
  const VehicleIcon = booking.vehicle_type === 'CAR' ? Car : Bike

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
        title={`Booking ${booking.id.replace('booking-', '#')}`}
        description={`${getServicePackageName(booking.service_package_id)} — ${booking.booking_date.split('-').reverse().join('/')}`}
        action={
          action ? (
            action.label === 'Thanh toán' ? (
              <Button
                onClick={() =>
                  window.alert(
                    'Xác nhận thanh toán CASH — sẽ triển khai đầy đủ ở commit mark paid.',
                  )
                }
              >
                {action.label}
              </Button>
            ) : (
              <Link to={action.to}>
                <Button>{action.label}</Button>
              </Link>
            )
          ) : undefined
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tiến trình xử lý</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingTimeline booking={booking} />
        </CardContent>
      </Card>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Thông tin khách & xe</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <User className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {getBookingCustomerName(booking)}
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
                  {getBookingPhone(booking) || '—'}
                </dd>
              </div>

              {booking.guest_email ? (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <dt className="text-slate-500">Email:</dt>
                  <dd className="font-medium text-slate-900">
                    {booking.guest_email}
                  </dd>
                </div>
              ) : null}

              <div className="flex items-center gap-2">
                <VehicleIcon className="h-4 w-4 text-slate-400" />
                <dt className="text-slate-500">Xe:</dt>
                <dd className="font-medium text-slate-900">
                  {booking.license_plate} ·{' '}
                  {VEHICLE_TYPE_LABELS[booking.vehicle_type]}
                </dd>
              </div>
            </dl>

            <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm">
              <p className="text-slate-500">Giờ hẹn</p>
              <p className="mt-1 font-medium text-slate-900">
                {formatTime(booking.start_time)} —{' '}
                {formatTime(booking.end_time)}
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
              <CardTitle>Chi tiết giá</CardTitle>
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
                    <dd className="text-lg font-semibold text-blue-600">
                      {formatPrice(booking.final_price)}
                    </dd>
                  </div>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Phương thức</dt>
                  <dd className="font-medium text-slate-900">
                    Tiền mặt (CASH)
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Buồng rửa</CardTitle>
            </CardHeader>
            <CardContent>
              {washBay ? (
                <div className="rounded-xl bg-blue-50 px-4 py-3">
                  <p className="font-medium text-slate-900">{washBay.name}</p>
                  <p className="text-sm text-slate-600">
                    {washBay.bay_code} · {VEHICLE_TYPE_LABELS[washBay.vehicle_type]}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  Chưa gán buồng rửa
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Các bước dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <BookingServiceStepSummary steps={serviceSteps} />
        </CardContent>
      </Card>
    </div>
  )
}
