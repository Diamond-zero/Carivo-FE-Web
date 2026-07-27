import { useEffect, useMemo } from 'react'
import { CircleDollarSign, Clock, Package, ShoppingBag } from 'lucide-react'
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
import { AdminAnalyticsFiltersPanel } from '../../../components/admin/analytics/AdminAnalyticsFiltersPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAnalyticsServices } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { formatCurrency } from '../../../lib/utils'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'

export function AdminAnalyticsServicesPage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()

  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const { data, isLoading, isError, error } = useAdminAnalyticsServices(params)

  useEffect(() => {
    if (isError) {
      showToast(
        getApiErrorMessage(error, 'Không tải được analytics dịch vụ.'),
        'error',
      )
    }
  }, [isError, error, showToast])

  if (isLoading || !data) return <DashboardPageSkeleton />

  const { rows } = data
  const totalBookings = rows.reduce((sum, row) => sum + row.total_bookings, 0)
  const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0)
  const topService = [...rows].sort((a, b) => b.total_revenue - a.total_revenue)[0]
  const avgCompletionRate =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.completion_rate, 0) / rows.length
      : 0
  const chartData = rows.map((row) => ({
    label: row.service_name,
    revenue: row.total_revenue,
    bookings: row.total_bookings,
  }))

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Hiệu suất gói dịch vụ"
        description="Phân tích booking, doanh thu và thời lượng dịch vụ trung bình của từng gói."
      />

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng gói"
          value={rows.length}
          icon={Package}
          accent="brand"
        />
        <StatCard
          label="Tổng booking"
          value={totalBookings.toLocaleString('vi-VN')}
          icon={ShoppingBag}
          accent="emerald"
        />
        <StatCard
          label="Doanh thu dịch vụ"
          value={formatCurrency(totalRevenue)}
          icon={CircleDollarSign}
          accent="violet"
        />
        <StatCard
          label="Tỉ lệ hoàn thành TB"
          value={`${avgCompletionRate.toFixed(1)}%`}
          icon={Clock}
          accent="amber"
        />
      </div>

      {topService ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Top gói doanh thu cao nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-lg font-semibold text-slate-900">
                {topService.service_name}
              </span>
              <span className="rounded-full bg-brand-100 px-3 py-0.5 text-xs font-medium text-brand-700">
                {topService.total_bookings.toLocaleString('vi-VN')} booking
              </span>
              <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-medium text-emerald-700">
                {formatCurrency(topService.total_revenue)}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Doanh thu theo gói dịch vụ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
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
          <CardTitle className="text-base">Chi tiết gói dịch vụ</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Chưa có dữ liệu gói dịch vụ trong khoảng thời gian đã chọn.
            </p>
          ) : (
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Gói dịch vụ</th>
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Hoàn thành</th>
                  <th className="px-6 py-3">Doanh thu</th>
                  <th className="px-6 py-3">TB / booking</th>
                  <th className="px-6 py-3">Phút / dịch vụ</th>
                  <th className="px-6 py-3">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.service_package_id}
                    className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{row.service_name}</div>
                      <div className="text-xs text-slate-500">{row.service_code}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.total_bookings.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-emerald-600">
                      {row.completed_bookings.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(row.total_revenue)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatCurrency(row.average_order_value)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.actual_duration_average_minutes ||
                        row.scheduled_duration_average_minutes ||
                        '—'}{' '}
                      ph
                    </td>
                    <td className="px-6 py-4 font-semibold text-brand-700">
                      {row.completion_rate.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
