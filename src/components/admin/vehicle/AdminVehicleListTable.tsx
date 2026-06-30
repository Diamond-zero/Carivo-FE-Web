import { createColumnHelper } from '@tanstack/react-table'
import { Car, Trash2 } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '../../../lib/utils'
import { formatDate } from '../../../utils/format'
import type { Vehicle } from '../../../types/vehicle'
import { DataTable } from '../../ui/DataTable'

const CAR_BODY_LABELS: Record<string, string> = {
  HATCHBACK: 'Hatchback',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  MPV: 'MPV',
  PICKUP: 'Pickup',
  VAN: 'Van',
}

const CC_GROUP_LABELS: Record<string, string> = {
  UNDER_175CC: 'Dưới 175cc',
  OVER_175CC: 'Từ 175cc',
}

const columnHelper = createColumnHelper<Vehicle>()

interface AdminVehicleListTableProps {
  vehicles: Vehicle[]
  customerNameById?: Record<string, string>
  hasActiveFilter?: boolean
  onEdit: (vehicleId: string) => void
  onDelete: (vehicleId: string) => void
}

export function AdminVehicleListTable({
  vehicles,
  customerNameById,
  hasActiveFilter = false,
  onEdit,
  onDelete,
}: AdminVehicleListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'plate',
        header: 'Biển số',
        cell: ({ row }) => (
          <div>
            <p className="font-mono text-sm font-semibold text-slate-900">
              {row.original.raw_license_plate}
            </p>
            {row.original.normalized_license_plate &&
            row.original.normalized_license_plate !== row.original.raw_license_plate ? (
              <p className="font-mono text-xs text-slate-500">
                ({row.original.normalized_license_plate})
              </p>
            ) : null}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'type',
        header: 'Loại xe',
        cell: ({ row }) => (
          <div className="text-sm">
            <p className="font-medium text-slate-900">
              {row.original.vehicle_type === 'CAR' ? 'Ô tô' : 'Xe máy'}
            </p>
            {row.original.vehicle_type === 'CAR'
              ? row.original.car_body_type
                ? CAR_BODY_LABELS[row.original.car_body_type]
                : '—'
              : row.original.motorbike_cc_group
                ? CC_GROUP_LABELS[row.original.motorbike_cc_group]
                : '—'}
          </div>
        ),
      }),
      columnHelper.display({
        id: 'engine',
        header: 'Động cơ',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.engine_type === 'ELECTRIC' ? 'Điện' : 'Xăng'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'info',
        header: 'Hãng / Mẫu / Màu',
        cell: ({ row }) => (
          <div className="text-sm text-slate-700">
            <p className="font-medium">
              {[row.original.brand, row.original.model].filter(Boolean).join(' ') || '—'}
            </p>
            <p className="text-xs text-slate-500">{row.original.color || '—'}</p>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'customer',
        header: 'Khách sở hữu',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {customerNameById?.[row.original.customer_id] ?? row.original.customer_id}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'default',
        header: 'Mặc định',
        cell: ({ row }) =>
          row.original.is_default ? (
            <span className="inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-800">
              Mặc định
            </span>
          ) : (
            <span className="text-xs text-slate-400">—</span>
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
                : 'bg-slate-100 text-slate-600',
            )}
          >
            {row.original.is_active ? 'Đang dùng' : 'Ngưng'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'created',
        header: 'Ngày tạo',
        cell: ({ row }) => (
          <span className="text-xs text-slate-500">
            {row.original.id ? formatDate(new Date().toISOString()) : '—'}
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
              className="carivo-link text-sm"
              onClick={() => onEdit(row.original.id)}
            >
              Sửa
            </button>
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
    [customerNameById, onEdit, onDelete],
  )

  return (
    <DataTable
      columns={columns}
      data={vehicles}
      emptyState={{
        icon: Car,
        title: hasActiveFilter ? 'Không tìm thấy phương tiện' : 'Chưa có phương tiện',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc loại xe.'
          : 'Thêm phương tiện cho khách hàng để hỗ trợ đặt lịch nhanh hơn.',
      }}
    />
  )
}