import { createColumnHelper } from '@tanstack/react-table'
import { Ban, Trash2, Users } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import type { User } from '../../../types/user'
import { Button } from '../../ui/Button'
import { CopyValueButton } from '../../ui/CopyValueButton'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<User>()

interface AdminCustomerListTableProps {
  customers: User[]
  hasActiveFilter?: boolean
  onToggleActive?: (userId: string) => void
  onDelete?: (userId: string) => void
}

export function AdminCustomerListTable({
  customers,
  hasActiveFilter = false,
  onToggleActive,
  onDelete,
}: AdminCustomerListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'customer',
        header: 'Khách hàng',
        cell: ({ row }) => (
          <div>
            <Link
              to={`/admin/users/customers/${row.original.id}`}
              className="carivo-link"
            >
              {row.original.full_name}
            </Link>
            <p className="text-xs text-slate-500">{row.original.phone}</p>
            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
              <span
                className="max-w-32 truncate font-mono"
                title={row.original.id}
              >
                {row.original.id}
              </span>
              <CopyValueButton
                value={row.original.id}
                label="ID customer"
                className="text-slate-500"
              />
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => info.getValue() ?? <span className="text-slate-400">—</span>,
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
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/admin/users/customers/${row.original.id}`}
              className="carivo-link text-sm"
            >
              Xem
            </Link>
            {onToggleActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-amber-600 hover:text-amber-700"
                onClick={() => onToggleActive(row.original.id)}
              >
                <Ban className="h-3.5 w-3.5" />
                {row.original.is_active ? 'Khóa' : 'Mở'}
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 text-xs text-red-600 hover:text-red-700"
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [onDelete, onToggleActive],
  )

  return (
    <DataTable
      columns={columns}
      data={customers}
      emptyState={{
        icon: Users,
        title: hasActiveFilter ? 'Không tìm thấy khách hàng' : 'Chưa có khách hàng',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa tìm kiếm hoặc bộ lọc trạng thái.'
          : 'Dữ liệu khách hàng toàn hệ thống sẽ hiển thị tại đây.',
      }}
    />
  )
}
