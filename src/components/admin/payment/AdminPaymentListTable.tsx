import { createColumnHelper } from '@tanstack/react-table'
import { Wallet } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getAdminGarageName } from '../../../mocks/admin'
import type { Booking } from '../../../types/booking'
import { getAdminBookingCustomerName } from '../../../utils/adminBooking'
import { formatDateTime, formatPrice } from '../../../utils/format'
import { BookingStatusBadge } from '../../booking/BookingStatusBadge'
import { PaymentStatusBadge } from '../../booking/PaymentStatusBadge'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<Booking>()

interface AdminPaymentListTableProps {
  bookings: Booking[]
  hasActiveFilter?: boolean
}

/**
 * Bảng danh sách payment — vì BE chưa có `GET /admin/payments` list nên ta
 * hiển thị booking có payment_status != UNPAID. Mỗi row link sang
 * `/admin/payments/:bookingId` (detail page sẽ tự lookup paymentId qua
 * bookingId khi cần).
 */
export function AdminPaymentListTable({
  bookings,
  hasActiveFilter = false,
}: AdminPaymentListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã booking',
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
        header: 'Chi nhánh',
        cell: (info) => getAdminGarageName(info.getValue()),
      }),
      columnHelper.display({
        id: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">
              {getAdminBookingCustomerName(row.original)}
            </p>
            {row.original.customer_phone ? (
              <p className="text-xs text-slate-500">{row.original.customer_phone}</p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.accessor('start_time', {
        header: 'Giờ hẹn',
        cell: (info) => (
          <div>
            <p>{formatDateTime(info.getValue())}</p>
          </div>
        ),
      }),
      columnHelper.accessor('final_price', {
        header: 'Số tiền',
        cell: (info) => formatPrice(info.getValue()),
      }),
      columnHelper.accessor('payment_status', {
        header: 'Trạng thái TT',
        cell: (info) => <PaymentStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('status', {
        header: 'Booking',
        cell: (info) => <BookingStatusBadge status={info.getValue()} />,
      }),
      columnHelper.accessor('payment_method', {
        header: 'Phương thức',
        cell: (info) => {
          const method = info.getValue()
          if (method === 'PAYOS') return 'PayOS'
          if (method === 'CASH') return 'Tiền mặt'
          return method || '—'
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/admin/payments/by-booking/${row.original.id}`}
              className="carivo-link text-sm"
            >
              Xem payment
            </Link>
          </div>
        ),
      }),
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={bookings}
      hasActiveFilter={hasActiveFilter}
      emptyState={{
        icon: Wallet,
        title: 'Chưa có giao dịch thanh toán',
        description:
          'Các giao dịch PayOS trên toàn hệ thống sẽ hiển thị tại đây. Điều chỉnh bộ lọc nếu bạn không thấy giao dịch mong muốn.',
      }}
    />
  )
}
