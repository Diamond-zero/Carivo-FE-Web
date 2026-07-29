import { createColumnHelper } from '@tanstack/react-table'
import { CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { getAdminGarageName } from '../../../mocks/admin'
import { getAdminServicePackageName } from '../../../mocks/admin'
import type { Booking } from '../../../types/booking'
import { formatDateTime, formatPrice } from '../../../utils/format'
import { BookingStatusBadge } from '../../booking/BookingStatusBadge'
import { CopyValueButton } from '../../ui/CopyValueButton'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<Booking>()

interface AdminCustomerBookingsTableProps {
  bookings: Booking[]
  /** Optional: BE/admin-supplied map `garageId -> display name`. Fallback is mock lookup, then raw ID. */
  garageNameById?: Record<string, string>
}

function resolveGarageName(
  garageId: string,
  garageNameById?: Record<string, string>,
) {
  return (
    garageNameById?.[garageId] ?? getAdminGarageName(garageId) ?? garageId
  )
}

function resolveServicePackageName(booking: Booking) {
  return (
    booking.service_package_name ??
    getAdminServicePackageName(booking.service_package_id) ??
    booking.service_package_id
  )
}

export function AdminCustomerBookingsTable({
  bookings,
  garageNameById,
}: AdminCustomerBookingsTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã',
        cell: (info) => {
          const bookingId = info.getValue()
          return (
            <div className="flex items-center gap-1">
              <span className="font-mono text-xs text-slate-600">
                {bookingId.replace('booking-', 'BK-')}
              </span>
              <CopyValueButton
                value={bookingId}
                label="mã booking"
                className="text-slate-500"
              />
            </div>
          )
        },
      }),
      columnHelper.accessor('garage_id', {
        header: 'Chi nhánh',
        cell: (info) => resolveGarageName(info.getValue(), garageNameById),
      }),
      columnHelper.accessor('license_plate', {
        header: 'Biển số',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('service_package_id', {
        header: 'Gói dịch vụ',
        cell: ({ row }) => resolveServicePackageName(row.original),
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
    [garageNameById],
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
