import { createColumnHelper } from '@tanstack/react-table'
import { Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import type { StaffCustomerSummary } from '../../utils/customerLookup'
import { formatDateTime } from '../../utils/format'
import { DataTable } from '../ui/DataTable'

const columnHelper = createColumnHelper<StaffCustomerSummary>()

interface CustomerListTableProps {
  customers: StaffCustomerSummary[]
  hasActiveSearch?: boolean
}

export function CustomerListTable({
  customers,
  hasActiveSearch = false,
}: CustomerListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <Link
              to={`/customers/${row.original.user.id}`}
              className="carivo-link"
            >
              {row.original.user.full_name}
            </Link>
            <p className="text-xs text-slate-500">{row.original.user.phone}</p>
          </div>
        ),
      }),
      columnHelper.accessor('garageBookingCount', {
        header: 'Lượt tại garage',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('lastVisitAt', {
        header: 'Lần ghé gần nhất',
        cell: (info) => {
          const value = info.getValue()
          return value ? formatDateTime(value) : '—'
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/customers/${row.original.user.id}`}
            className="carivo-link text-sm"
          >
            Xem chi tiết
          </Link>
        ),
      }),
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={customers}
      emptyState={{
        icon: Users,
        title: hasActiveSearch
          ? 'Không tìm thấy khách hàng'
          : 'Chưa có khách hàng tại garage',
        description: hasActiveSearch
          ? 'Thử tìm theo tên, số điện thoại hoặc biển số xe.'
          : 'Khách đã đặt lịch tại garage sẽ xuất hiện ở đây.',
      }}
    />
  )
}
