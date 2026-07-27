import { RotateCcw, Search } from 'lucide-react'
import { useAdminGarageOptions } from '../../../hooks/api/admin/useAdminGarages'
import type { PaymentStatus } from '../../../types/booking'
import { Button } from '../../ui/Button'
import { Input } from '../../ui/Input'
import { Label } from '../../ui/Label'
import { Select } from '../../ui/Select'
import {
  type AdminPaymentFilters,
} from '../../../hooks/api/admin/useAdminPayments'

interface AdminPaymentListFiltersProps {
  filters: AdminPaymentFilters
  onChange: (filters: AdminPaymentFilters) => void
  onReset: () => void
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: 'Chưa thanh toán',
  PENDING: 'Đang chờ',
  PAID: 'Đã thanh toán',
  PARTIAL: 'Thanh toán một phần',
  REFUNDED: 'Đã hoàn tiền',
}

const PAYMENT_STATUS_VALUES: PaymentStatus[] = [
  'PENDING',
  'PAID',
  'PARTIAL',
  'REFUNDED',
]

export function AdminPaymentListFilters({
  filters,
  onChange,
  onReset,
}: AdminPaymentListFiltersProps) {
  const garages = useAdminGarageOptions()

  const update = (patch: Partial<AdminPaymentFilters>) => {
    onChange({ ...filters, ...patch })
  }

  const hasActiveFilters =
    (filters.status !== 'ALL' && Boolean(filters.status)) ||
    (filters.garageId !== 'ALL' && Boolean(filters.garageId)) ||
    Boolean(filters.dateFrom) ||
    Boolean(filters.dateTo) ||
    Boolean(filters.query?.trim())

  return (
    <div className="carivo-panel p-4">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-700">
        <Search className="h-4 w-4" />
        Bộ lọc giao dịch thanh toán
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div>
          <Label htmlFor="admin-payment-garage">Chi nhánh</Label>
          <Select
            id="admin-payment-garage"
            value={filters.garageId ?? 'ALL'}
            onChange={(event) => update({ garageId: event.target.value })}
          >
            <option value="ALL">Tất cả chi nhánh</option>
            {garages.map((garage) => (
              <option key={garage.id} value={garage.id}>
                {garage.name}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="admin-payment-status">Trạng thái thanh toán</Label>
          <Select
            id="admin-payment-status"
            value={
              Array.isArray(filters.status)
                ? filters.status[0] ?? 'ALL'
                : filters.status ?? 'ALL'
            }
            onChange={(event) =>
              update({ status: event.target.value as PaymentStatus | 'ALL' })
            }
          >
            <option value="ALL">Tất cả trạng thái</option>
            {PAYMENT_STATUS_VALUES.map((value) => (
              <option key={value} value={value}>
                {PAYMENT_STATUS_LABELS[value]}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="admin-payment-from">Từ ngày</Label>
          <Input
            id="admin-payment-from"
            type="date"
            value={filters.dateFrom ?? ''}
            onChange={(event) => update({ dateFrom: event.target.value })}
          />
        </div>

        <div>
          <Label htmlFor="admin-payment-to">Đến ngày</Label>
          <Input
            id="admin-payment-to"
            type="date"
            value={filters.dateTo ?? ''}
            onChange={(event) => update({ dateTo: event.target.value })}
          />
        </div>

        <div className="md:col-span-2 xl:col-span-1">
          <Label htmlFor="admin-payment-query">Tìm kiếm</Label>
          <Input
            id="admin-payment-query"
            placeholder="Mã booking, biển số, SĐT khách..."
            value={filters.query ?? ''}
            onChange={(event) => update({ query: event.target.value })}
          />
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="mt-4 flex justify-end">
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      ) : null}
    </div>
  )
}
