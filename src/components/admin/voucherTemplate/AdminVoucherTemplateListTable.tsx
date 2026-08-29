import { createColumnHelper } from '@tanstack/react-table'
import { Coins } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { VOUCHER_TEMPLATE_TYPE_LABELS } from '../../../constants/voucherTemplate'
import { getTierLabel } from '../../../constants/loyaltyTier'
import { formatCurrency } from '../../../lib/utils'
import type { VoucherTemplate } from '../../../types/voucherTemplate'
import { cn } from '../../../lib/utils'
import { formatDateTime } from '../../../utils/format'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<VoucherTemplate>()

function formatVoucherValue(voucherTemplate: VoucherTemplate) {
  if (voucherTemplate.voucher_type === 'FREE_SERVICE') {
    return 'Tặng gói dịch vụ'
  }
  if (voucherTemplate.voucher_type === 'PERCENTAGE') {
    const cap =
      voucherTemplate.max_discount_amount != null
        ? `, tối đa ${formatCurrency(voucherTemplate.max_discount_amount)}`
        : ''
    return `${voucherTemplate.value}%${cap}`
  }
  return formatCurrency(voucherTemplate.value)
}

interface AdminVoucherTemplateListTableProps {
  voucherTemplates: VoucherTemplate[]
  hasActiveFilter?: boolean
  onToggleActive: (voucherTemplateId: string) => void
  onDelete?: (voucherTemplateId: string) => void
}

export function AdminVoucherTemplateListTable({
  voucherTemplates,
  hasActiveFilter = false,
  onToggleActive,
  onDelete,
}: AdminVoucherTemplateListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'voucherTemplate',
        header: 'Voucher đổi điểm',
        cell: ({ row }) => (
          <div>
            <p className="font-medium text-slate-900">{row.original.name}</p>
            <p className="text-sm text-slate-600">
              {VOUCHER_TEMPLATE_TYPE_LABELS[row.original.voucher_type]}
              {row.original.service_package_name
                ? ` · ${row.original.service_package_name}`
                : ''}
            </p>
          </div>
        ),
      }),
      columnHelper.display({
        id: 'value',
        header: 'Giá trị',
        cell: ({ row }) => (
          <span className="font-medium text-brand-700">{formatVoucherValue(row.original)}</span>
        ),
      }),
      columnHelper.display({
        id: 'points_cost',
        header: 'Điểm đổi',
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 font-medium text-amber-700">
            <Coins className="h-3.5 w-3.5" />
            {row.original.points_cost.toLocaleString('vi-VN')}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'tiers',
        header: 'Hạng',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.applicable_tiers
              .map((tier) => getTierLabel(tier))
              .join(', ') || 'Tất cả'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'redeemed',
        header: 'Đã đổi',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.redeemed_count}
            {row.original.total_quantity != null ? ` / ${row.original.total_quantity}` : ''}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'remaining',
        header: 'Còn lại',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.remaining_quantity == null
              ? 'Không giới hạn'
              : row.original.remaining_quantity}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'period',
        header: 'Thời gian',
        cell: ({ row }) => (
          <div className="text-xs text-slate-600">
            <p>{formatDateTime(row.original.start_at)}</p>
            <p className="text-slate-400">→ {formatDateTime(row.original.end_at)}</p>
          </div>
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
            {row.original.is_active ? 'Đang chạy' : 'Tạm dừng'}
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
              {row.original.is_active ? 'Tạm dừng' : 'Kích hoạt'}
            </button>
            <Link
              to={`/admin/voucher-templates/${row.original.id}/edit`}
              className="carivo-link text-sm"
            >
              Sửa
            </Link>
            {onDelete ? (
              <button
                type="button"
                className="text-sm font-medium text-red-600 hover:text-red-800"
                onClick={() => onDelete(row.original.id)}
              >
                Xóa
              </button>
            ) : null}
          </div>
        ),
      }),
    ],
    [onToggleActive, onDelete],
  )

  return (
    <DataTable
      columns={columns}
      data={voucherTemplates}
      emptyState={{
        icon: Coins,
        title: hasActiveFilter ? 'Không tìm thấy voucher đổi điểm' : 'Chưa có voucher đổi điểm',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc loại voucher / trạng thái.'
          : 'Tạo voucher để khách hàng dùng điểm tích lũy đổi lấy.',
      }}
    />
  )
}
