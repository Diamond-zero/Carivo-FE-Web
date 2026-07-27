import { Link } from 'react-router-dom'
import { CalendarDays, Car, MapPin, User } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../ui/Card'
import { getAdminGarageName } from '../../../mocks/admin'
import { getAdminServicePackageName } from '../../../mocks/admin'
import { getAdminBookingCustomerName } from '../../../utils/adminBooking'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import type { ApiBooking } from '../../../types/api/staff'
import { formatDateTime, formatPrice } from '../../../utils/format'

interface AdminPaymentBookingCardProps {
  booking: ApiBooking
}

export function AdminPaymentBookingCard({ booking }: AdminPaymentBookingCardProps) {
  const mapped = mapApiBooking(booking)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-brand-600" />
          Booking liên kết
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Link
            to={`/admin/bookings/${booking.id}`}
            className="carivo-link font-mono text-xs"
          >
            {booking.id.replace('booking-', 'BK-')}
          </Link>
          <span className="text-xs text-slate-500">
            {booking.created_at ? formatDateTime(booking.created_at) : '—'}
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DetailRow
            icon={User}
            label="Khách hàng"
            value={getAdminBookingCustomerName(mapped)}
          />
          <DetailRow
            icon={Car}
            label="Phương tiện"
            value={`${booking.license_plate ?? '—'} · ${booking.vehicle_type}`}
          />
          <DetailRow
            icon={MapPin}
            label="Chi nhánh"
            value={getAdminGarageName(booking.garage_id)}
          />
          <DetailRow
            icon={CalendarDays}
            label="Gói dịch vụ"
            value={
              booking.service_package?.name ??
              getAdminServicePackageName(booking.service_package_id)
            }
          />
        </div>

        <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Giờ hẹn
            </p>
            <p className="mt-1 font-medium text-slate-800">
              {formatDateTime(booking.start_time)} → {formatDateTime(booking.end_time)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Tổng tiền booking
            </p>
            <p className="mt-1 font-medium text-slate-800">
              {formatPrice(booking.final_price)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarDays
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}
