import { createColumnHelper } from '@tanstack/react-table'
import { Eye } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import {
  STAFF_TYPE_CHANGE_STATUS_COLORS,
  STAFF_TYPE_CHANGE_STATUS_LABELS,
} from '../../../constants/staffTypeChange'
import { STAFF_TYPE_LABELS } from '../../../constants/staffType'
import type { ApiStaffTypeChangeRequest } from '../../../api/staffTypeChange.api'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<ApiStaffTypeChangeRequest>()

interface AdminStaffTypeChangeRequestListTableProps {
  requests: ApiStaffTypeChangeRequest[]
  hasActiveFilter?: boolean
}

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function AdminStaffTypeChangeRequestListTable({
  requests,
  hasActiveFilter = false,
}: AdminStaffTypeChangeRequestListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'Mã yêu cầu',
        cell: (info) => (
          <span className="font-mono text-xs font-semibold text-slate-700">
            #{info.getValue().slice(0, 8)}
          </span>
        ),
      }),
      columnHelper.accessor('staff_profile_id', {
        header: 'Mã NV',
        cell: (info) => (
          <span className="font-mono text-xs text-slate-600">
            {info.getValue().slice(0, 10)}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'transition',
        header: 'Chuyển từ → sang',
        cell: ({ row }) => {
          const from = row.original.from_staff_type
          const to = row.original.to_staff_type
          return (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 font-medium ring-1 ring-inset',
                  STAFF_TYPE_CHANGE_STATUS_COLORS.REQUESTED,
                )}
              >
                {STAFF_TYPE_LABELS[from as keyof typeof STAFF_TYPE_LABELS] ?? from}
              </span>
              <span aria-hidden className="text-slate-400">→</span>
              <span
                className={cn(
                  'inline-flex rounded-full px-2 py-0.5 font-medium ring-1 ring-inset',
                  STAFF_TYPE_CHANGE_STATUS_COLORS.APPROVED,
                )}
              >
                {STAFF_TYPE_LABELS[to as keyof typeof STAFF_TYPE_LABELS] ?? to}
              </span>
            </div>
          )
        },
      }),
      columnHelper.accessor('reason', {
        header: 'Lý do',
        cell: (info) => (
          <span className="line-clamp-2 text-sm text-slate-700">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái',
        cell: (info) => {
          const status = info.getValue()
          return (
            <span
              className={cn(
                'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                STAFF_TYPE_CHANGE_STATUS_COLORS[status] ??
                  'bg-slate-100 text-slate-700 ring-slate-200',
              )}
            >
              {STAFF_TYPE_CHANGE_STATUS_LABELS[status] ?? status}
            </span>
          )
        },
      }),
      columnHelper.accessor('effective_at', {
        header: 'Áp dụng',
        cell: (info) => (
          <span className="text-sm text-slate-700">
            {formatDateTime(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            to={`/admin/staff-type-change-requests/${row.original.id}`}
            className="carivo-link inline-flex items-center gap-1 text-sm"
          >
            <Eye className="h-3.5 w-3.5" />
            Xem
          </Link>
        ),
      }),
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={requests}
      emptyState={{
        icon: undefined,
        title: hasActiveFilter
          ? 'Không tìm thấy yêu cầu'
          : 'Chưa có yêu cầu đổi chức năng',
        description: hasActiveFilter
          ? 'Thử đổi bộ lọc trạng thái.'
          : 'Khi nhân viên gửi yêu cầu chuyển chức năng, danh sách sẽ xuất hiện ở đây.',
      }}
    />
  )
}
