import { createColumnHelper } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { getAdminGarageName } from '../../../mocks/admin'
import { getAdminServicePackageName } from '../../../mocks/admin/servicePackages'
import type { Booking } from '../../../types/booking'
import { formatDateTime, formatPrice } from '../../../utils/format'
import { BookingStatusBadge } from '../../booking/BookingStatusBadge'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<Booking>()

interface AdminCustomerBookingsTableProps {
  bookings: Booking[]
}

export function AdminCustomerBookingsTable({
  bookings,
}: AdminCustomerBookingsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-600">
            {info.getValue().replace('booking-', 'BK-')}
          </span>
        ),
      }),
      columnHelper.accessor('garage_id', {
        header: 'Garage',
        cell: (info) => getAdminGarageName(info.getValue()),
      }),
      columnHelper.accessor('license_plate', {
        header: 'Biển số',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('service_package_id', {
        header: 'Gói dịch vụ',
        cell: (info) => getAdminServicePackageName(info.getValue()),
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
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={bookings}
      emptyState={{
        icon: CalendarDays,
        title: 'Chưa có booking',
        description: 'Lịch sử đặt lịch của khách trên toàn hệ thống sẽ hiển thị tại đây.',
      }}
    />
  )
}
