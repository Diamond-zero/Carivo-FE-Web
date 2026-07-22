import { CircleDollarSign, Percent, Tag, Ticket } from 'lucide-react'
import { useEffect } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAnalyticsPromotions } from '../../../hooks/api/admin/useAdminAnalytics'
import { formatCurrency } from '../../../lib/utils'

export function AdminAnalyticsPromotionsPage() {
  const { showToast } = useToast()
  const { data, isLoading, isError, error } = useAdminAnalyticsPromotions()
  const rows = data?.rows ?? []

  useEffect(() => {
    if (isError) {
      showToast(
        getApiErrorMessage(error, 'Không tải được analytics khuyến mãi.'),
        'error',
      )
    }
  }, [isError, error, showToast])

  if (isLoading) return <DashboardPageSkeleton />

  const totalUses = rows.reduce((sum, row) => sum + row.total_uses, 0)
  const totalDiscount = rows.reduce((sum, row) => sum + row.total_discount, 0)
  const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0)
  const conversionRows = rows.filter(
    (row) => row.conversion_rate > 0,
  )
  const avgConversion =
    conversionRows.length > 0
      ? (
          conversionRows.reduce((sum, row) => sum + row.conversion_rate, 0) /
          conversionRows.length *
          100
        ).toFixed(1)
      : '—'

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Hiệu quả khuyến mãi"
        description="Theo dõi số lượt sử dụng, tổng tiền giảm giá và doanh thu kèm theo của từng chương trình khuyến mãi."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Số chương trình"
          value={rows.length}
          icon={Tag}
          accent="brand"
        />
        <StatCard
          label="Tổng lượt dùng"
          value={totalUses.toLocaleString('vi-VN')}
          icon={Ticket}
          accent="emerald"
        />
        <StatCard
          label="Tổng giảm giá"
          value={formatCurrency(totalDiscount)}
          icon={Percent}
          accent="amber"
        />
        <StatCard
          label="Doanh thu kèm KM"
          value={formatCurrency(totalRevenue)}
          icon={CircleDollarSign}
          accent="violet"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Lượt sử dụng theo chương trình</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="code" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [value as number, 'Lượt dùng']} />
                <Bar dataKey="total_uses" fill="#a855f7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết chương trình</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Chưa có dữ liệu khuyến mãi.
            </p>
          ) : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Mã</th>
                  <th className="px-6 py-3">Tên</th>
                  <th className="px-6 py-3">Lượt dùng</th>
                  <th className="px-6 py-3">Giảm giá</th>
                  <th className="px-6 py-3">Doanh thu</th>
                  <th className="px-6 py-3">Chuyển đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.promotion_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-700">
                      {row.code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.promotion_name}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.total_uses.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatCurrency(row.total_discount)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(row.total_revenue)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.conversion_rate > 0
                        ? `${(row.conversion_rate * 100).toFixed(1)}%`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {avgConversion !== '—' ? (
        <p className="mt-4 text-xs text-slate-500">
          Tỷ lệ chuyển đổi trung bình: {avgConversion}%
        </p>
      ) : null}
    </div>
  )
}