import { createColumnHelper } from '@tanstack/react-table'
import { UserCog } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  STAFF_TYPE_COLORS,
  STAFF_TYPE_LABELS,
} from '../../../constants/staffType'
import type { AdminStaffRecord } from '../../../types/admin'
import { cn } from '../../../lib/utils'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<AdminStaffRecord>()

interface AdminStaffListTableProps {
  staff: AdminStaffRecord[]
  hasActiveFilter?: boolean
  onToggleActive: (profileId: string) => void
}

export function AdminStaffListTable({
  staff,
  hasActiveFilter = false,
  onToggleActive,
}: AdminStaffListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'staff',
        header: 'Nhân viên',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.user.full_name}</p>
            <p className="text-xs text-slate-500">{row.original.user.phone}</p>
          </div>
        ),
      }),
      columnHelper.accessor('profile.staff_code', {
        header: 'Mã NV',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-slate-700">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('profile.staff_type', {
        header: 'Vai trò',
        cell: (info) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              STAFF_TYPE_COLORS[info.getValue()],
            )}
          >
            {STAFF_TYPE_LABELS[info.getValue()]}
          </span>
        ),
      }),
      columnHelper.accessor('garage.name', {
        header: 'Garage',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'status',
        header: 'Trạng thái',
        cell: ({ row }) => {
          const active = row.original.profile.is_active && row.original.user.is_active
          return (
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
                active
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700',
              )}
            >
              {active ? 'Đang làm việc' : 'Ngưng làm việc'}
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
              onClick={() => onToggleActive(row.original.profile.id)}
            >
              {row.original.profile.is_active ? 'Ngưng' : 'Kích hoạt'}
            </button>
            <Link
              to={`/admin/users/staff/${row.original.profile.id}/edit`}
              className="carivo-link text-sm"
            >
              Sửa
            </Link>
          </div>
        ),
      }),
    ],
    [onToggleActive],
  )

  return (
    <DataTable
      columns={columns}
      data={staff}
      emptyState={{
        icon: UserCog,
        title: hasActiveFilter ? 'Không tìm thấy nhân viên' : 'Chưa có nhân viên',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc garage / vai trò.'
          : 'Thêm hồ sơ nhân viên mới để quản lý trên toàn hệ thống.',
      }}
    />
  )
}
