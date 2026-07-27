import { useEffect, useMemo } from 'react'
import {
  Building2,
  CircleDollarSign,
  Clock,
  Gauge,
  Ticket,
} from 'lucide-react'
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
import { useAdminAnalyticsGarages } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { formatCurrency } from '../../../lib/utils'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'

export function AdminAnalyticsGaragesPage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()

  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const { data, isLoading, isError, error } = useAdminAnalyticsGarages(params)

  useEffect(() => {
    if (isError) {
      showToast(
        getApiErrorMessage(error, 'Không tải được analytics chi nhánh.'),
        'error',
      )
    }
  }, [isError, error, showToast])

  if (isLoading || !data) return <DashboardPageSkeleton />

  const { rows } = data
  const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0)
  const totalBookings = rows.reduce((sum, row) => sum + row.total_bookings, 0)
  const totalCompleted = rows.reduce((sum, row) => sum + row.completed_bookings, 0)
  const totalCanceled = rows.reduce((sum, row) => sum + row.canceled_bookings, 0)
  const avgCompletionRate =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.completion_rate, 0) / rows.length
      : 0
  const chartData = rows.map((row) => ({
    label: row.garage_name,
    revenue: row.total_revenue,
    bookings: row.total_bookings,
  }))

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Hiệu suất chi nhánh"
        description="Tổng quan doanh thu, booking và thời lượng dịch vụ của từng chi nhánh trên toàn hệ thống."
      />

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Số chi nhánh"
          value={rows.length}
          icon={Building2}
          accent="brand"
        />
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(totalRevenue)}
          icon={CircleDollarSign}
          accent="emerald"
        />
        <StatCard
          label="Tổng booking"
          value={totalBookings.toLocaleString('vi-VN')}
          icon={Ticket}
          accent="violet"
        />
        <StatCard
          label="Tỉ lệ hoàn thành TB"
          value={`${avgCompletionRate.toFixed(1)}%`}
          icon={Gauge}
          accent="amber"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Doanh thu theo chi nhánh</CardTitle>
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
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Doanh thu" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết chi nhánh</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Chưa có dữ liệu chi nhánh trong khoảng thời gian đã chọn.
            </p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Chi nhánh</th>
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Hoàn thành</th>
                  <th className="px-6 py-3">Hủy</th>
                  <th className="px-6 py-3">Doanh thu</th>
                  <th className="px-6 py-3">TB / booking</th>
                  <th className="px-6 py-3">Phút / dịch vụ</th>
                  <th className="px-6 py-3">Hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.garage_id}
                    className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      <div>{row.garage_name}</div>
                      <div className="text-xs text-slate-500">{row.garage_code}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.total_bookings.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-emerald-600">
                      {row.completed_bookings.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-red-600">
                      {row.canceled_bookings.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(row.total_revenue)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatCurrency(row.average_order_value)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {row.actual_duration_average_minutes ||
                          row.scheduled_duration_average_minutes ||
                          '—'}{' '}
                        ph
                      </span>
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

      <p className="mt-4 text-xs text-slate-500">
        Tổng cộng: {totalCompleted.toLocaleString('vi-VN')} booking hoàn thành,{' '}
        {totalCanceled.toLocaleString('vi-VN')} booking đã hủy trong tất cả chi nhánh.
      </p>
    </div>
  )
}
