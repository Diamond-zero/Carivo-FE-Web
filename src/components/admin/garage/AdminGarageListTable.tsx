import { createColumnHelper } from '@tanstack/react-table'
import { Building2 } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../../lib/utils'
import type { AdminGarageSummary } from '../../../utils/adminGarageLookup'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<AdminGarageSummary>()

interface AdminGarageListTableProps {
  garages: AdminGarageSummary[]
  hasActiveFilter?: boolean
  onToggleActive: (garageId: string) => void
}

export function AdminGarageListTable({
  garages,
  hasActiveFilter = false,
  onToggleActive,
}: AdminGarageListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'garage',
        header: 'Garage',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="font-mono text-xs text-slate-500">{row.original.garage_code}</p>
          </div>
        ),
      }),
      columnHelper.accessor('city', {
        header: 'Thành phố',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('phone', {
        header: 'Hotline',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'hours',
        header: 'Giờ mở cửa',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.opening_time} – {row.original.closing_time}
          </span>
        ),
      }),
      columnHelper.accessor('slot_interval_minutes', {
        header: 'Slot (phút)',
        cell: (info) => info.getValue(),
      }),
      columnHelper.display({
        id: 'washBays',
        header: 'Buồng rửa',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.activeWashBayCount}/{row.original.washBayCount} hoạt động
          </span>
        ),
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
            {row.original.is_active ? 'Đang hoạt động' : 'Ngưng hoạt động'}
          </span>
        ),
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
              {row.original.is_active ? 'Ngưng' : 'Kích hoạt'}
            </button>
            <Link
              to={`/admin/garages/${row.original.id}/edit`}
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
      data={garages}
      emptyState={{
        icon: Building2,
        title: hasActiveFilter ? 'Không tìm thấy garage' : 'Chưa có garage',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc trạng thái.'
          : 'Thêm garage mới để mở rộng mạng lưới Carivo.',
      }}
    />
  )
}
