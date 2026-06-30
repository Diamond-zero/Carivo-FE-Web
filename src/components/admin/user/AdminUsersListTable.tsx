import { createColumnHelper } from '@tanstack/react-table'
import { Trash2, UserCog } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import type { User } from '../../../types/user'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<User>()

interface AdminUsersListTableProps {
  users: User[]
  hasActiveFilter?: boolean
  onToggleActive: (userId: string) => void
  onDelete: (userId: string) => void
}

const ROLE_COLORS: Record<User['role'], string> = {
  CUSTOMER: 'bg-sky-100 text-sky-700',
  STAFF: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-violet-100 text-violet-700',
}

const ROLE_LABELS: Record<User['role'], string> = {
  CUSTOMER: 'Khách hàng',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị viên',
}

export function AdminUsersListTable({
  users,
  hasActiveFilter = false,
  onToggleActive,
  onDelete,
}: AdminUsersListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'user',
        header: 'Người dùng',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.full_name}</p>
            <p className="text-xs text-slate-500">{row.original.phone}</p>
          </div>
        ),
      }),
      columnHelper.accessor('email', {
        header: 'Email',
        cell: (info) => (
          <span className="text-sm text-slate-600">
            {info.getValue() ?? <span className="text-slate-400">—</span>}
          </span>
        ),
        enableSorting: false,
      }),
      columnHelper.accessor('role', {
        header: 'Vai trò',
        cell: (info) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              ROLE_COLORS[info.getValue()],
            )}
          >
            {ROLE_LABELS[info.getValue()]}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const active = row.original.is_active
          return (
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700',
              )}
            >
              {active ? 'Hoạt động' : 'Đã khóa'}
            </span>
          )
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
              onClick={() => onToggleActive(row.original.id)}
            >
              {row.original.is_active ? 'Khóa' : 'Mở khóa'}
            </button>
            {row.original.role === 'CUSTOMER' ? (
              <Link
                to={`/admin/users/customers/${row.original.id}`}
                className="carivo-link text-sm"
              >
                Chi tiết
              </Link>
            ) : null}
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
              onClick={() => onDelete(row.original.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xóa
            </button>
          </div>
        ),
      }),
    ],
    [onToggleActive, onDelete],
  )

  return (
    <DataTable
      columns={columns}
      data={users}
      emptyState={{
        icon: UserCog,
        title: hasActiveFilter ? 'Không tìm thấy người dùng' : 'Chưa có người dùng',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc vai trò / trạng thái.'
          : 'Danh sách toàn bộ người dùng trên hệ thống sẽ hiển thị tại đây.',
      }}
    />
  )
}