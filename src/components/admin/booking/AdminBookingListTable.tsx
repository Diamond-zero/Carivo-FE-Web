import { createColumnHelper } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAdminGarageName, getAdminServicePackageName } from '../../../mocks/admin'
import type { Booking } from '../../../types/booking'
import { getAdminBookingCustomerName } from '../../../utils/adminBooking'
import { formatTime, formatPrice } from '../../../utils/format'
import { BookingStatusBadge } from '../../booking/BookingStatusBadge'
import { PaymentStatusBadge } from '../../booking/PaymentStatusBadge'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<Booking>()

interface AdminBookingListTableProps {
  bookings: Booking[]
  hasActiveFilter?: boolean
}

export function AdminBookingListTable({
  bookings,
  hasActiveFilter = false,
}: AdminBookingListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã',
        cell: (info) => (
          <Link
            to={`/admin/bookings/${info.getValue()}`}
            className="carivo-link font-mono text-xs"
          >
            {info.getValue().replace('booking-', 'BK-')}
          </Link>
        ),
      }),
      columnHelper.accessor('garage_id', {
        header: 'Garage',
        cell: (info) => getAdminGarageName(info.getValue()),
      }),
      columnHelper.display({
        id: 'customer',
        header: 'Khách',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">
              {getAdminBookingCustomerName(row.original)}
            </p>
            {row.original.is_walk_in ? (
              <p className="text-xs text-slate-500">Walk-in</p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor('license_plate', {
        header: 'Biển số',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('service_package_id', {
        header: 'Gói DV',
        cell: (info) => getAdminServicePackageName(info.getValue()),
      }),
      columnHelper.accessor('start_time', {
        header: 'Giờ hẹn',
        cell: (info) => (
          <div>
            <p>{formatTime(info.getValue())}</p>
            <p className="text-xs text-slate-500">
              {info.row.original.booking_date.split('-').reverse().join('/')}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('final_price', {
        header: 'Thành tiền',
        cell: (info) => formatPrice(info.getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => <BookingStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('payment_status', {
        header: 'Thanh toán',
        cell: (info) => <PaymentStatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/admin/bookings/${row.original.id}`}
            className="carivo-link text-sm"
          >
            Chi tiết
          </Link>
        ),
      }),
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={bookings}
      emptyState={{
        icon: CalendarDays,
        title: hasActiveFilter ? 'Không tìm thấy booking' : 'Chưa có booking',
        description: hasActiveFilter
          ? 'Thử đổi bộ lọc garage, trạng thái hoặc khoảng ngày.'
          : 'Booking toàn hệ thống sẽ hiển thị tại đây.',
      }}
    />
  )
}
