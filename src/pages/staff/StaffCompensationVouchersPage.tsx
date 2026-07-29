import { Hourglass, Loader2, Ticket } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { getApiErrorMessage } from '../../api/client'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Label } from '../../components/ui/Label'
import { Select } from '../../components/ui/Select'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { useToast } from '../../contexts/ToastContext'
import {
  CUSTOMER_VOUCHER_SOURCE_LABELS,
  CUSTOMER_VOUCHER_STATUS_LABELS,
  CUSTOMER_VOUCHER_STATUS_VARIANT,
  CUSTOMER_VOUCHER_TYPE_LABELS,
  useStaffCustomerVouchers,
} from '../../hooks/api/staff/useStaffCustomerVouchers'
import type { ApiCustomerVoucher } from '../../types/api/staff'
import { formatDateTime } from '../../utils/format'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  ...Object.entries(CUSTOMER_VOUCHER_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
]

const SOURCE_OPTIONS = [
  { value: 'ALL', label: 'Tất cả nguồn' },
  ...Object.entries(CUSTOMER_VOUCHER_SOURCE_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
]

function formatVoucherValue(voucher: ApiCustomerVoucher): string {
  if (voucher.voucher_type === 'PERCENTAGE') {
    return `${voucher.value}%`
  }
  if (voucher.voucher_type === 'FREE_SERVICE') {
    return 'Miễn phí'
  }
  return `${voucher.value.toLocaleString('vi-VN')} đ`
}

function describeSource(voucher: ApiCustomerVoucher): string {
  if (voucher.source_type) {
    return CUSTOMER_VOUCHER_SOURCE_LABELS[voucher.source_type] ?? voucher.source_type
  }
  if (voucher.source_incident_id || voucher.source_booking_incident_id) {
    return 'Bồi thường sự cố'
  }
  if (voucher.source_customer_case_id) {
    return 'Hồ sơ khiếu nại'
  }
  return '—'
}

export function StaffCompensationVouchersPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [sourceFilter, setSourceFilter] = useState<string>('ALL')
  const [page, setPage] = useState(1)

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      source: sourceFilter === 'ALL' ? undefined : sourceFilter,
    }),
    [page, statusFilter, sourceFilter],
  )

  const { data, isLoading, isError, error } = useStaffCustomerVouchers(params)

  const vouchers: ApiCustomerVoucher[] = data?.vouchers ?? []
  const meta = data?.meta
  const totalPages = meta?.total_pages ?? 1
  const total = meta?.total ?? vouchers.length
  const issuedCount = vouchers.filter((item) => item.status === 'ISSUED').length
  const pendingCount = vouchers.filter((item) => item.status === 'PENDING_APPROVAL').length

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được danh sách voucher.'), 'error')
    }
  }, [isError, error, showToast])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, sourceFilter])

  return (
    <div>
      {isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <>
          <PageHeader
            eyebrow="Carivo Staff"
            title="Voucher bồi thường"
            description="Theo dõi các voucher đã phát cho khách hàng tại chi nhánh của bạn."
          />

          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Tổng voucher" value={total} icon={Ticket} accent="brand" />
            <StatCard
              label="Đã phát hành (trang này)"
              value={issuedCount}
              icon={Ticket}
      accent="emerald"
            />
            <StatCard
              label="Chờ duyệt (trang này)"
              value={pendingCount}
              icon={Hourglass}
              accent="amber"
            />
          </div>

          <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="carivo-panel p-4">
              <Label htmlFor="voucher-status">Trạng thái</Label>
              <Select
                id="voucher-status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="carivo-panel p-4">
              <Label htmlFor="voucher-source">Nguồn phát hành</Label>
              <Select
                id="voucher-source"
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
              >
                {SOURCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {total} voucher
                {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {vouchers.length === 0 ? (
                <EmptyState
                  icon={Ticket}
                  title="Chưa có voucher nào"
                  description="Voucher bồi thường được tạo khi staff phát hành cho khách qua modal sự cố hoặc khi admin xử lý hồ sơ khiếu nại."
                />
              ) : (
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Mã voucher</th>
                      <th className="px-6 py-3">Loại</th>
                      <th className="px-6 py-3">Giá trị</th>
                      <th className="px-6 py-3">Nguồn</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3">Hết hạn</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vouchers.map((voucher) => (
                      <tr key={voucher.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 font-mono text-slate-900">
                          {voucher.code}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {CUSTOMER_VOUCHER_TYPE_LABELS[voucher.voucher_type] ??
                            voucher.voucher_type}
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-900">
                          {formatVoucherValue(voucher)}
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {describeSource(voucher)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge
                            variant={
                              CUSTOMER_VOUCHER_STATUS_VARIANT[voucher.status] ?? 'default'
                            }
                          >
                            {CUSTOMER_VOUCHER_STATUS_LABELS[voucher.status] ?? voucher.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {voucher.expires_at
                            ? formatDateTime(voucher.expires_at)
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {totalPages > 1 ? (
            <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Trang trước
              </Button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
              >
                Trang sau
              </Button>
            </div>
          ) : null}
        </>
      )}

      {isLoading ? <Loader2 className="hidden" /> : null}
    </div>
  )
}
