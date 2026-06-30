import { createColumnHelper } from '@tanstack/react-table'
import { Droplets, Trash2, Wrench } from 'lucide-react'
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
  onChangeStatus: (bayId: string) => void
  onDelete: (bayId: string) => void
}

export function AdminWashBayListTable({
  washBays,
  hasActiveFilter = false,
  onEdit,
  onChangeStatus,
  onDelete,
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
        header: 'Chi nhánh',
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
        cell: ({ row }) => {
          const canDelete = row.original.status !== 'OCCUPIED'
          const canToggleStatus =
            row.original.status === 'AVAILABLE' || row.original.status === 'MAINTENANCE'
          const nextStatusLabel =
            row.original.status === 'MAINTENANCE' ? 'Mở lại' : 'Bảo trì'
          const nextStatusTitle =
            row.original.status === 'MAINTENANCE'
              ? 'Chuyển buồng rửa về trạng thái trống'
              : 'Chuyển buồng rửa sang trạng thái bảo trì'
          return (
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 hover:text-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canToggleStatus}
                title={
                  canToggleStatus
                    ? nextStatusTitle
                    : 'Chỉ chuyển được khi buồng đang trống hoặc đang bảo trì.'
                }
                onClick={() => onChangeStatus(row.original.id)}
              >
                <Wrench className="h-3.5 w-3.5" />
                {nextStatusLabel}
              </button>
              <button
                type="button"
                className="carivo-link text-sm"
                onClick={() => onEdit(row.original.id)}
              >
                Sửa
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={!canDelete}
                title={
                  canDelete
                    ? 'Xóa buồng rửa'
                    : 'Buồng đang có booking — không thể xóa.'
                }
                onClick={() => onDelete(row.original.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Xóa
              </button>
            </div>
          )
        },
      }),
    ],
    [onEdit, onChangeStatus, onDelete],
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
