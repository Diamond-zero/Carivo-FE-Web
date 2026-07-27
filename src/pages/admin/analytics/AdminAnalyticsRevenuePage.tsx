import { useEffect, useMemo } from 'react'
import { Building2, CircleDollarSign, TrendingUp, Wallet } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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
import { useAdminAnalyticsRevenue } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { formatCurrency } from '../../../lib/utils'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'

const PAYMENT_COLORS = ['#06b6a4', '#8b5cf6', '#f59e0b', '#0ea5e9', '#ec4899', '#10b981']

export function AdminAnalyticsRevenuePage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()

  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const { data, isLoading, isError, error } = useAdminAnalyticsRevenue(params)

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được analytics doanh thu.'), 'error')
    }
  }, [isError, error, showToast])

  if (isLoading || !data) {
    return <DashboardPageSkeleton />
  }

  const { metrics, trend, byGarage, byServicePackage, byVehicleType, byPaymentMethod } = data
  const trendChart = trend.map((row) => ({
    label: row.label,
    revenue: row.revenue,
    count: row.count,
  }))
  const lastTrend = trend[trend.length - 1]
  const firstTrend = trend[0]
  const lastRevenue = lastTrend?.revenue ?? 0
  const firstRevenue = firstTrend?.revenue ?? 0
  const trendDelta =
    firstRevenue > 0 ? Math.round(((lastRevenue - firstRevenue) / firstRevenue) * 100) : 0
  const topGarage = [...byGarage].sort((a, b) => b.revenue - a.revenue)[0]
  const totalDiscount = metrics.total_discount
  const avgOrderValue = metrics.average_order_value

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Doanh thu"
        description="Phân tích doanh thu theo khoảng thời gian, chi nhánh, gói dịch vụ và phương thức thanh toán."
      />

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Doanh thu thuần"
          value={formatCurrency(metrics.net_revenue)}
          icon={CircleDollarSign}
          accent="brand"
          hint={
            trendDelta === 0
              ? 'So với đầu kỳ'
              : `${trendDelta > 0 ? '+' : ''}${trendDelta}% so với đầu kỳ`
          }
        />
        <StatCard
          label="Doanh thu gốc"
          value={formatCurrency(metrics.original_revenue)}
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          label="Tổng giảm giá"
          value={formatCurrency(totalDiscount)}
          icon={Wallet}
          accent="amber"
        />
        <StatCard
          label="Giá trị TB / booking"
          value={formatCurrency(avgOrderValue)}
          icon={Building2}
          accent="violet"
          hint={`${metrics.paid_booking_count.toLocaleString('vi-VN')} booking đã thanh toán`}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xu hướng doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 1_000_000)}tr`}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#06b6a4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6a4' }}
                    name="Doanh thu"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doanh thu theo chi nhánh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byGarage} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 1_000_000)}tr`}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={140}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#06b6a4" radius={[0, 6, 6, 0]} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo loại xe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byVehicleType}
                    dataKey="revenue"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {byVehicleType.map((entry, index) => (
                      <Cell
                        key={entry.id}
                        fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byPaymentMethod}
                    dataKey="revenue"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {byPaymentMethod.map((entry, index) => (
                      <Cell
                        key={entry.id}
                        fill={PAYMENT_COLORS[index % PAYMENT_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top gói dịch vụ theo doanh thu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byServicePackage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 1_000_000)}tr`}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} name="Doanh thu" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Chi tiết doanh thu theo chi nhánh</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {byGarage.length === 0 ? (
              <p className="px-6 py-4 text-sm text-slate-500">Chưa có dữ liệu doanh thu.</p>
            ) : (
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Chi nhánh</th>
                    <th className="px-6 py-3">Booking</th>
                    <th className="px-6 py-3">Doanh thu</th>
                    <th className="px-6 py-3">TB / booking</th>
                  </tr>
                </thead>
                <tbody>
                  {byGarage.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">{row.label}</td>
                      <td className="px-6 py-4 text-slate-700">
                        {row.count.toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 font-medium text-brand-700">
                        {formatCurrency(row.revenue)}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {formatCurrency(
                          row.count > 0 ? Math.round(row.revenue / row.count) : 0,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {topGarage ? (
        <p className="mt-4 text-xs text-slate-500">
          Chi nhánh dẫn đầu: <span className="font-semibold text-slate-700">{topGarage.label}</span>{' '}
          với {formatCurrency(topGarage.revenue)}.
        </p>
      ) : null}
    </div>
  )
}
