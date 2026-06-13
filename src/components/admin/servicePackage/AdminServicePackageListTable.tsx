import { createColumnHelper } from '@tanstack/react-table'
import { Package } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  SERVICE_TYPE_COLORS,
  SERVICE_TYPE_LABELS,
} from '../../../constants/servicePackage'
import { VEHICLE_TYPE_LABELS } from '../../../constants/washBayStatus'
import { formatCurrency } from '../../../lib/utils'
import type { ServicePackage } from '../../../types/servicePackage'
import { cn } from '../../../lib/utils'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<ServicePackage>()

interface AdminServicePackageListTableProps {
  packages: ServicePackage[]
  hasActiveFilter?: boolean
  onToggleActive: (packageId: string) => void
}

export function AdminServicePackageListTable({
  packages,
  hasActiveFilter = false,
  onToggleActive,
}: AdminServicePackageListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'package',
        header: 'Gói dịch vụ',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="font-mono text-xs text-slate-500">{row.original.id}</p>
          </div>
        ),
      }),
      columnHelper.accessor('service_type', {
        header: 'Loại',
        cell: (info) => (
          <span
            className={cn(
              'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              SERVICE_TYPE_COLORS[info.getValue()],
            )}
          >
            {SERVICE_TYPE_LABELS[info.getValue()]}
          </span>
        ),
      }),
      columnHelper.accessor('vehicle_type', {
        header: 'Xe',
        cell: (info) => VEHICLE_TYPE_LABELS[info.getValue()],
      }),
      columnHelper.accessor('base_price', {
        header: 'Giá',
        cell: (info) => (
          <span className="font-medium text-slate-900">
            {formatCurrency(info.getValue())}
          </span>
        ),
      }),
      columnHelper.accessor('duration_minutes', {
        header: 'Thời lượng',
        cell: (info) => `${info.getValue()} phút`,
      }),
      columnHelper.display({
        id: 'steps',
        header: 'Steps',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.steps_template.length} bước
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
            {row.original.is_active ? 'Đang bán' : 'Ngưng bán'}
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
              to={`/admin/services/packages/${row.original.id}/steps`}
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Steps
            </Link>
            <Link
              to={`/admin/services/packages/${row.original.id}/edit`}
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
      data={packages}
      emptyState={{
        icon: Package,
        title: hasActiveFilter ? 'Không tìm thấy gói dịch vụ' : 'Chưa có gói dịch vụ',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc loại xe / dịch vụ.'
          : 'Thêm gói dịch vụ mới cho hệ thống Carivo.',
      }}
    />
  )
}
