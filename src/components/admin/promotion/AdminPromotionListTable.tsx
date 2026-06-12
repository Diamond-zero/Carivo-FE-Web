import { createColumnHelper } from '@tanstack/react-table'
import { Gift } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DISCOUNT_TYPE_LABELS } from '../../../constants/promotion'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { formatCurrency } from '../../../lib/utils'
import type { Promotion } from '../../../types/promotion'
import { cn } from '../../../lib/utils'
import { formatDateTime } from '../../../utils/format'
import { DataTable } from '../../ui/DataTable'

const columnHelper = createColumnHelper<Promotion>()

function formatDiscount(promo: Promotion) {
  if (promo.discount_type === 'PERCENTAGE') {
    const cap =
      promo.max_discount_amount != null
        ? `, tối đa ${formatCurrency(promo.max_discount_amount)}`
        : ''
    return `${promo.discount_value}%${cap}`
  }

  return formatCurrency(promo.discount_value)
}

interface AdminPromotionListTableProps {
  promotions: Promotion[]
  hasActiveFilter?: boolean
  onToggleActive: (promotionId: string) => void
}

export function AdminPromotionListTable({
  promotions,
  hasActiveFilter = false,
  onToggleActive,
}: AdminPromotionListTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: 'promotion',
        header: 'Khuyến mãi',
        cell: ({ row }) => (
          <div>
            <p className="font-mono font-medium text-slate-900">{row.original.code}</p>
            <p className="text-sm text-slate-600">{row.original.name}</p>
          </div>
        ),
      }),
      columnHelper.accessor('discount_type', {
        header: 'Loại',
        cell: (info) => DISCOUNT_TYPE_LABELS[info.getValue()],
      }),
      columnHelper.display({
        id: 'discount',
        header: 'Giảm',
        cell: ({ row }) => (
          <span className="font-medium text-brand-700">{formatDiscount(row.original)}</span>
        ),
      }),
      columnHelper.display({
        id: 'tiers',
        header: 'Hạng',
        cell: ({ row }) => (
          <span className="text-sm text-slate-600">
            {row.original.applicable_tiers
              .map((tier) => LOYALTY_TIER_LABELS[tier])
              .join(', ')}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'usage',
        header: 'Đã dùng',
        cell: ({ row }) => (
          <span className="text-sm text-slate-700">
            {row.original.used_count}
            {row.original.usage_limit != null ? ` / ${row.original.usage_limit}` : ''}
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
              to={`/admin/promotions/${row.original.id}/edit`}
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
      data={promotions}
      emptyState={{
        icon: Gift,
        title: hasActiveFilter ? 'Không tìm thấy khuyến mãi' : 'Chưa có khuyến mãi',
        description: hasActiveFilter
          ? 'Thử đổi từ khóa hoặc bộ lọc loại giảm / trạng thái.'
          : 'Tạo mã khuyến mãi mới cho hệ thống Carivo.',
      }}
    />
  )
}
