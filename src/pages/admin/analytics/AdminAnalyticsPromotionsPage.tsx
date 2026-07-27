import { useEffect, useMemo } from 'react'
import {
  CircleDollarSign,
  Percent,
  Tag,
  Ticket,
  Users,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getApiErrorMessage } from '../../../api/client'
import { AdminAnalyticsFiltersPanel } from '../../../components/admin/analytics/AdminAnalyticsFiltersPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAnalyticsPromotions } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { formatCurrency } from '../../../lib/utils'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'

const PROMO_COLORS = ['#a855f7', '#06b6a4', '#f59e0b', '#0ea5e9', '#ec4899']

export function AdminAnalyticsPromotionsPage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()

  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const { data, isLoading, isError, error } = useAdminAnalyticsPromotions(params)

  useEffect(() => {
    if (isError) {
      showToast(
        getApiErrorMessage(error, 'Không tải được analytics khuyến mãi.'),
        'error',
      )
    }
  }, [isError, error, showToast])

  if (isLoading || !data) return <DashboardPageSkeleton />

  const { overview, rows, usageByGarage } = data
  const totalUses = rows.reduce((sum, row) => sum + row.total_uses, 0)
  const totalDiscount = rows.reduce((sum, row) => sum + row.total_discount, 0)
  const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0)
  const chartData = rows.map((row) => ({
    label: row.code,
    uses: row.total_uses,
    revenue: row.total_revenue,
  }))
  const usageByGarageData = usageByGarage.map((row) => ({
    label: row.label,
    count: row.count,
  }))

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Hiệu quả khuyến mãi"
        description="Theo dõi số lượt sử dụng, tổng tiền giảm giá và doanh thu kèm theo của từng chương trình khuyến mãi."
      />

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Chương trình hoạt động"
          value={rows.length}
          icon={Tag}
          accent="brand"
        />
        <StatCard
          label="Tổng lượt dùng"
          value={totalUses.toLocaleString('vi-VN')}
          icon={Ticket}
          accent="emerald"
          hint={`${overview.unique_customer_count.toLocaleString('vi-VN')} khách đã dùng`}
        />
        <StatCard
          label="Tổng giảm giá"
          value={formatCurrency(totalDiscount)}
          icon={Percent}
          accent="amber"
          hint={`TB ${formatCurrency(overview.average_discount)} / lượt`}
        />
        <StatCard
          label="Doanh thu kèm KM"
          value={formatCurrency(totalRevenue)}
          icon={CircleDollarSign}
          accent="violet"
          hint={`${overview.walk_in_usage_count.toLocaleString('vi-VN')} lượt walk-in`}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lượt sử dụng theo chương trình</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Bar dataKey="uses" radius={[6, 6, 0, 0]}>
                    {chartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={PROMO_COLORS[index % PROMO_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Lượt dùng theo chi nhánh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usageByGarageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Lượt dùng" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết chương trình</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Chưa có dữ liệu khuyến mãi trong khoảng thời gian đã chọn.
            </p>
          ) : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Mã</th>
                  <th className="px-6 py-3">Tên</th>
                  <th className="px-6 py-3">Lượt dùng</th>
                  <th className="px-6 py-3">Giảm giá</th>
                  <th className="px-6 py-3">TB / lượt</th>
                  <th className="px-6 py-3">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.promotion_id}
                    className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                  >
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
                    <td className="px-6 py-4 text-slate-700">
                      {formatCurrency(row.average_discount)}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(row.total_revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <p className="mt-4 text-xs text-slate-500 inline-flex items-center gap-1">
        <Users className="h-3.5 w-3.5" />
        {overview.unique_customer_count.toLocaleString('vi-VN')} khách hàng đã sử dụng khuyến mãi.
      </p>
    </div>
  )
}
