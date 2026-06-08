import {
  Bike,
  Car,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BookingStatusBadge } from '../booking/BookingStatusBadge'
import { BookingTimeline } from '../booking/BookingTimeline'
import { PaymentStatusBadge } from '../booking/PaymentStatusBadge'
import { Button } from '../ui/Button'
import { Drawer } from '../ui/Drawer'
import { VEHICLE_TYPE_LABELS } from '../../constants/washBayStatus'
import { getServicePackageName } from '../../mocks/servicePackages'
import type { Booking } from '../../types/booking'
import type { WashBay } from '../../types/washBay'
import {
  getBookingCustomerName,
  getBookingPhone,
} from '../../utils/booking'
import { formatDateTime, formatPrice, formatTime } from '../../utils/format'

interface BookingExecutionDrawerProps {
  open: boolean
  onClose: () => void
  booking: Booking
  washBay?: WashBay | null
  needsWashBayAssignment?: boolean
  onRequestAssignWashBay?: () => void
}

export function BookingExecutionDrawer({
  open,
  onClose,
  booking,
  washBay,
  needsWashBayAssignment = false,
  onRequestAssignWashBay,
}: BookingExecutionDrawerProps) {
  const VehicleIcon = booking.vehicle_type === 'CAR' ? Car : Bike

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Booking ${booking.id.replace('booking-', '#')}`}
      description={`${getServicePackageName(booking.service_package_id)} · ${booking.license_plate}`}
      footer={
        <Link
          to={`/bookings/${booking.id}`}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          onClick={onClose}
        >
          <ExternalLink className="h-4 w-4" />
          Mở trang booking đầy đủ
        </Link>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <PaymentStatusBadge status={booking.payment_status} />
          {booking.is_walk_in ? (
            <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
              Walk-in
            </span>
          ) : null}
        </div>

        <section>
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Tiến trình
          </h3>
          <BookingTimeline booking={booking} />
        </section>

        <section className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Khách & xe
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-sm">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="font-medium text-slate-900">
                  {getBookingCustomerName(booking)}
                </p>
                <p className="text-slate-500">
                  {booking.is_walk_in ? 'Khách vãng lai' : 'Khách đăng ký'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
              <span>{getBookingPhone(booking) || '—'}</span>
            </div>

            {booking.guest_email ? (
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                <span className="truncate">{booking.guest_email}</span>
              </div>
            ) : null}

            <div className="flex items-center gap-2 text-slate-600">
              <VehicleIcon className="h-4 w-4 shrink-0 text-slate-400" />
              <span>
                {booking.license_plate} ·{' '}
                {VEHICLE_TYPE_LABELS[booking.vehicle_type]}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-100 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Giờ hẹn
          </h3>
          <p className="text-sm font-medium text-slate-900">
            {formatTime(booking.start_time)} — {formatTime(booking.end_time)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {formatDateTime(booking.start_time)}
          </p>
        </section>

        <section className="rounded-xl border border-slate-100 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-900">
            Chi tiết giá
          </h3>
          <dl className="space-y-2 text-sm">
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
            <div className="flex justify-between gap-4 border-t border-slate-100 pt-2">
              <dt className="font-medium text-slate-900">Thành tiền</dt>
              <dd className="font-semibold text-brand-700">
                {formatPrice(booking.final_price)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-100 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-slate-900">Buồng rửa</h3>
            {needsWashBayAssignment && onRequestAssignWashBay ? (
              <Button size="sm" onClick={onRequestAssignWashBay}>
                <MapPin className="h-4 w-4" />
                Gán buồng
              </Button>
            ) : null}
          </div>
          {washBay ? (
            <div className="rounded-lg bg-brand-50 px-3 py-2.5 text-sm">
              <p className="font-medium text-slate-900">{washBay.name}</p>
              <p className="text-slate-600">
                {washBay.bay_code} · {VEHICLE_TYPE_LABELS[washBay.vehicle_type]}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              {needsWashBayAssignment
                ? 'Chưa gán buồng rửa.'
                : 'Chưa gán buồng rửa hoặc không yêu cầu.'}
            </p>
          )}
        </section>

        {booking.note ? (
          <section className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <p className="font-medium">Ghi chú</p>
            <p className="mt-1">{booking.note}</p>
          </section>
        ) : null}
      </div>
    </Drawer>
  )
}
