import { createColumnHelper } from '@tanstack/react-table'
import { Droplets } from 'lucide-react'
import { useMemo } from 'react'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { cn } from '../../../lib/utils'
import type { AdminWashBaySummary } from '../../../utils/adminWashBayLookup'
import { DataTable } from '../../ui/DataTable'
import { AdminWashBayStatusBadge } from './AdminWashBayStatusBadge'

const columnHelper = createColumnHelper<AdminWashBaySummary>()

interface AdminWashBayListTableProps {
  washBays: AdminWashBaySummary[]
  hasActiveFilter?: boolean
  onEdit: (bayId: string) => void
  onToggleActive: (bayId: string) => void
}

export function AdminWashBayListTable({
  washBays,
  hasActiveFilter = false,
  onEdit,
  onToggleActive,
}: AdminWashBayListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'bay',
        header: 'Buồng rửa',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="font-mono text-xs text-slate-500">{row.original.bay_code}</p>
          </div>
        ),
      }),
      columnHelper.accessor('garage_name', {
        header: 'Garage',
        cell: (info) => info.getValue(),
      }),
      columnHelper.accessor('vehicle_type', {
        header: 'Loại xe',
        cell: (info) => VEHICLE_TYPE_LABELS[info.getValue()],
      }),
      columnHelper.accessor('status', {
        header: 'Trạng thái vận hành',
        cell: (info) => <AdminWashBayStatusBadge status={info.getValue()} />,
      }),
      columnHelper.display({
        id: 'booking',
        header: 'Booking hiện tại',
        cell: ({ row }) =>
          row.original.current_booking_id ? (
            <span className="font-mono text-xs text-slate-600">
              {row.original.current_booking_id.replace('booking-', 'BK-')}
            </span>
          ) : (
            '—'
          ),
      }),
      columnHelper.display({
        id: 'active',
        header: 'Kích hoạt',
        cell: ({ row }) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium',
              row.original.is_active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700',
            )}
          >
            {row.original.is_active ? 'Bật' : 'Tắt'}
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
              className="text-sm font-medium text-slate-600 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={row.original.status === 'OCCUPIED'}
              onClick={() => onToggleActive(row.original.id)}
            >
              {row.original.is_active ? 'Tắt' : 'Bật'}
            </button>
            <button
              type="button"
              className="carivo-link text-sm"
              onClick={() => onEdit(row.original.id)}
            >
              Sửa
            </button>
          </div>
        ),
      }),
    ],
    [onEdit, onToggleActive],
  )

  return (
    <DataTable
      columns={columns}
      data={washBays}
      emptyState={{
        icon: Droplets,
        title: hasActiveFilter ? 'Không tìm thấy buồng rửa' : 'Chưa có buồng rửa',
        description: hasActiveFilter
          ? 'Thử đổi bộ lọc garage, loại xe hoặc trạng thái.'
          : 'Thêm buồng rửa mới cho các garage trong hệ thống.',
      }}
    />
  )
}
