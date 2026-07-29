import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, History, Trophy } from 'lucide-react'

import { Card } from '../../../components/ui/Card'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { getApiErrorMessage } from '../../../api/client'
import {
  useAdminCustomer,
  useAdminCustomerDetail,
} from '../../../hooks/api/admin/useAdminCustomers'
import {
  useAdminCustomerLoyaltyTransactions,
} from '../../../hooks/api/admin/useAdminCustomerExtras'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { formatDate, formatPrice } from '../../../utils/format'
import {
  LOYALTY_POINT_TRANSACTION_COLORS,
  LOYALTY_POINT_TRANSACTION_LABELS,
} from '../../../constants/loyaltyPointTransaction'

export function AdminCustomerLoyaltyPage() {
  const { id } = useParams<{ id: string }>()
  const customerId = id ?? ''
  const { customer } = useAdminCustomer(customerId)
  const [page, setPage] = useState(1)
  const limit = 20
  const {
    loyalty,
    isLoading: detailLoading,
    isError: detailError,
    error: detailErrorObj,
  } = useAdminCustomerDetail(customerId)
  const {
    data: txData,
    isLoading: txLoading,
  } = useAdminCustomerLoyaltyTransactions(customerId, { page, limit })

  const transactions = txData?.transactions ?? []
  const meta = txData?.meta
  const totalPages = meta && meta.total_pages ? meta.total_pages : 1

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Loyalty của ${customer?.full_name ?? 'khách hàng'}`}
        description="Xem điểm thưởng, hạng thành viên và lịch sử giao dịch điểm của khách."
        action={
          <Link to={`/admin/users/customers/${customerId}`}>
            <Button variant="secondary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
            </Button>
          </Link>
        }
      />

      {detailLoading ? (
        <DashboardPageSkeleton />
      ) : detailError ? (
        <EmptyState
          icon={Trophy}
          title="Không thể tải dữ liệu loyalty"
          description={getApiErrorMessage(detailErrorObj, 'Vui lòng thử lại sau.')}
        />
      ) : !loyalty ? (
        <EmptyState
          icon={Trophy}
          title="Khách hàng chưa tham gia loyalty"
          description="Tài khoản này chưa được ghi nhận trong chương trình thưởng — loyalty sẽ tự khởi tạo sau lần booking hoàn tất đầu tiên."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Điểm khả dụng"
              value={loyalty.available_points}
              icon={Trophy}
              accent="brand"
            />
            <StatCard
              label="Tổng điểm tích lũy"
              value={loyalty.total_points}
              icon={Trophy}
              accent="emerald"
            />
            <StatCard
              label="Hạng hiện tại"
              value={
                LOYALTY_TIER_LABELS[loyalty.current_tier] ?? loyalty.current_tier
              }
              icon={Trophy}
              accent="indigo"
            />
            <StatCard
              label="Đã đổi / hết hạn"
              value={`${loyalty.redeemed_points} / ${loyalty.expired_points}`}
              icon={History}
              accent="amber"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Tổng chi tiêu
              </p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatPrice(loyalty.total_spent)}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Tổng lượt ghé thăm:{' '}
                <span className="font-semibold text-slate-700">
                  {loyalty.total_visits}
                </span>
              </p>
            </Card>
            <Card className="p-5">
              <p className="text-xs uppercase tracking-wide text-slate-500">
                Quyền lợi hạng hiện tại
              </p>
              <p className="mt-2 text-sm text-slate-700">
                Hạng{' '}
                <span className="font-semibold">
                  {LOYALTY_TIER_LABELS[loyalty.current_tier] ?? loyalty.current_tier}
                </span>{' '}
                đã được áp dụng cho mọi giao dịch tích/đổi điểm của khách.
              </p>
            </Card>
          </div>

          <Card>
            <div className="flex items-center justify-between px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Lịch sử giao dịch điểm
              </h2>
              <Badge>
                {meta?.total ?? transactions.length} bản ghi
              </Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Loại</th>
                    <th className="px-6 py-3">Điểm</th>
                    <th className="px-6 py-3">Mô tả</th>
                    <th className="px-6 py-3">Ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {txLoading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-6 text-center text-slate-500"
                      >
                        Đang tải...
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-6 text-center text-slate-500"
                      >
                        Chưa có giao dịch điểm nào.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="text-slate-700">
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${LOYALTY_POINT_TRANSACTION_COLORS[tx.type]}`}
                          >
                            {LOYALTY_POINT_TRANSACTION_LABELS[tx.type] ?? tx.type}
                          </span>
                        </td>
                        <td className="px-6 py-3 font-semibold text-slate-900">
                          {tx.points > 0 ? `+${tx.points}` : tx.points}
                        </td>
                        <td className="px-6 py-3 text-slate-600">
                          {tx.description ?? '—'}
                        </td>
                        <td className="px-6 py-3 text-slate-500">
                          {tx.created_at ? formatDate(tx.created_at) : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 ? (
              <div className="flex items-center justify-end gap-2 px-6 py-4">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trang trước
                </Button>
                <span className="text-sm text-slate-500">
                  Trang {page}/{totalPages}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Trang sau
                </Button>
              </div>
            ) : null}
          </Card>
        </>
      )}
    </div>
  )
}
