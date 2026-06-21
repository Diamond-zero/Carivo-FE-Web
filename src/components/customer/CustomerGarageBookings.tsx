import { createColumnHelper } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useBookings } from '../../contexts/BookingContext'
import type { Booking } from '../../types/booking'
import { formatDateTime, formatPrice } from '../../utils/format'
import { BookingStatusBadge } from '../booking/BookingStatusBadge'
import { DataTable } from '../ui/DataTable'

const columnHelper = createColumnHelper<Booking>()

interface CustomerGarageBookingsProps {
  bookings: Booking[]
}

export function CustomerGarageBookings({ bookings }: CustomerGarageBookingsProps) {
  const { getServicePackageName } = useBookings()
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã',
        cell: (info) => (
          <Link
            to={`/bookings/${info.getValue()}`}
            className="carivo-link"
          >
            #{info.getValue().slice(-6)}
          </Link>
        ),
      }),
      columnHelper.accessor('license_plate', {
        header: 'Biển số',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('service_package_id', {
        header: 'Gói dịch vụ',
        cell: (info) =>
          getServicePackageName(
            info.getValue(),
            info.row.original.service_package_name,
          ),
      }),
      columnHelper.accessor('start_time', {
        header: 'Thời gian',
        cell: (info) => formatDateTime(info.getValue()),
      }),
      columnHelper.accessor('final_price', {
        header: 'Thành tiền',
        cell: (info) => formatPrice(info.getValue()),
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => <BookingStatusBadge status={info.getValue()} />,
      }),
    ],
    [getServicePackageName],
  )

  return (
    <DataTable
      columns={columns}
      data={bookings}
      emptyState={{
        icon: CalendarDays,
        title: 'Chưa có booking tại garage',
        description: 'Lịch sử đặt lịch của khách tại garage này sẽ hiển thị tại đây.',
      }}
    />
  )
}
