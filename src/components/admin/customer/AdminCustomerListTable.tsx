import { createColumnHelper } from '@tanstack/react-table'
import { Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { formatCurrency } from '../../../lib/utils'
import type { AdminCustomerSummary } from '../../../utils/adminCustomerLookup'
import { cn } from '../../../lib/utils'
import { DataTable } from '../../ui/DataTable'
import { TierBadge } from '../../customer/TierBadge'

const columnHelper = createColumnHelper<AdminCustomerSummary>()

interface AdminCustomerListTableProps {
  customers: AdminCustomerSummary[]
  hasActiveFilter?: boolean
}

export function AdminCustomerListTable({
  customers,
  hasActiveFilter = false,
}: AdminCustomerListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <Link
              to={`/admin/users/customers/${row.original.user.id}`}
              className="carivo-link"
            >
              {row.original.user.full_name}
            </Link>
            <p className="text-xs text-slate-500">{row.original.user.phone}</p>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'tier',
        header: 'Hạng loyalty',
        cell: ({ row }) => <TierBadge tier={row.original.loyalty.current_tier} />,
      }),
      columnHelper.accessor('loyalty.total_spent', {
        header: 'Tổng chi tiêu',
        cell: (info) => (
          <span className="font-medium text-slate-900">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('bookingCount', {
        header: 'Lượt booking',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
              row.original.is_active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700',
            )}
          >
            {row.original.is_active ? 'Đang hoạt động' : 'Đã khóa'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/admin/users/customers/${row.original.user.id}`}
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
        title: hasActiveFilter ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc hạng loyalty.'
          : 'Dữ liệu khách hàng toàn hệ thống sẽ hiển thị tại đây.',
      }}
    />
  )
}
