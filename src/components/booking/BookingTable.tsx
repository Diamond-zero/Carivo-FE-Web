import { createColumnHelper } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getServicePackageName } from '../../mocks/servicePackages'
import type { Booking } from '../../types/booking'
import { getBookingCustomerName } from '../../utils/booking'
import { getBookingListAction } from '../../utils/bookingActionGuards'
import { formatTime } from '../../utils/format'
import { Button } from '../ui/Button'
import { GuardedActionButton } from './GuardedActionButton'
import { DataTable } from '../ui/DataTable'
import { BookingStatusBadge } from './BookingStatusBadge'

const columnHelper = createColumnHelper<Booking>()

interface BookingTableProps {
  bookings: Booking[]
  emptyMessage?: string
  staffGarageId?: string
  onMarkPaid?: (booking: Booking) => void
}

export function BookingTable({
  bookings,
  emptyMessage = 'Không tìm thấy booking phù hợp',
  staffGarageId,
  onMarkPaid,
}: BookingTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã',
        cell: (info) => (
          <Link
            to={`/bookings/${info.getValue()}`}
            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            {info.getValue().replace('booking-', '#')}
          </Link>
        ),
      }),
      columnHelper.display({
        id: 'customer',
        header: 'Khách',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">
              {getBookingCustomerName(row.original)}
            </p>
            {row.original.is_walk_in ? (
              <p className="text-xs text-slate-500">Walk-in</p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor('license_plate', {
        header: 'Biển số',
        cell: (info) => (
          <span className="font-medium text-slate-800">{info.getValue()}</span>
        ),
      }),
      columnHelper.accessor('service_package_id', {
        header: 'Gói DV',
        cell: (info) => (
          <span className="text-slate-700">
            {getServicePackageName(info.getValue())}
          </span>
        ),
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
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => <BookingStatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Thao tác',
        cell: ({ row }) => {
          const action = getBookingListAction(row.original, staffGarageId)

          if (!action) {
            return <span className="text-xs text-slate-400">—</span>
          }

          if (action.type === 'mark_paid') {
            return (
              <GuardedActionButton
                guard={action.guard}
                variant="secondary"
                size="sm"
                showHint={false}
                onClick={() => onMarkPaid?.(row.original)}
              >
                {action.label}
              </GuardedActionButton>
            )
          }

          if (!action.guard.allowed || !action.to) {
            return (
              <Button
                variant="secondary"
                size="sm"
                disabled
                title={action.guard.reason}
              >
                {action.label}
              </Button>
            )
          }

          return (
            <Link to={action.to}>
              <Button variant="secondary" size="sm">
                {action.label}
              </Button>
            </Link>
          )
        },
      }),
    ],
    [staffGarageId, onMarkPaid],
  )

  return (
    <DataTable columns={columns} data={bookings} emptyMessage={emptyMessage} />
  )
}
