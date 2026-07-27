import { useEffect, useMemo } from 'react'
import {
  CalendarCheck,
  Car,
  Clock,
  Percent,
  TrendingUp,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
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
import { useAdminAnalyticsBookings } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { formatCurrency } from '../../../lib/utils'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'

const VEHICLE_COLORS = ['#06b6a4', '#8b5cf6']
const STATUS_COLORS = [
  '#22c55e',
  '#f59e0b',
  '#06b6a4',
  '#6366f1',
  '#94a3b8',
  '#ef4444',
  '#f97316',
]

export function AdminAnalyticsBookingsPage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()

  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const { data, isLoading, isError, error } = useAdminAnalyticsBookings(params)

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được analytics booking.'), 'error')
    }
  }, [isError, error, showToast])

  if (isLoading || !data) {
    return <DashboardPageSkeleton />
  }

  const { overview, trend, statusStats, vehicleTypeStats, timeOfDayStats, garageStats } = data
  const completionRate = overview.completion_rate
  const cancellationRate = overview.cancellation_rate
  const lastTrend = trend[trend.length - 1]
  const firstTrend = trend[0]
  const trendDelta =
    firstTrend && firstTrend.count > 0 && lastTrend
      ? Math.round(((lastTrend.count - firstTrend.count) / firstTrend.count) * 100)
      : 0

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Thống kê đặt lịch"
        description="Phân tích lượt đặt theo trạng thái, loại xe, khung giờ và xu hướng trong khoảng thời gian đã chọn."
      />

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng booking"
          value={overview.total_bookings.toLocaleString('vi-VN')}
          icon={CalendarCheck}
          accent="brand"
          hint={
            trendDelta === 0
              ? 'So với đầu kỳ'
              : `${trendDelta > 0 ? '+' : ''}${trendDelta}% so với đầu kỳ`
          }
        />
        <StatCard
          label="Hoàn thành"
          value={overview.completed_bookings.toLocaleString('vi-VN')}
          icon={CalendarCheck}
          accent="emerald"
          hint={`${completionRate.toFixed(1)}% tỉ lệ hoàn thành`}
        />
        <StatCard
          label="Vãng lai / Thành viên"
          value={`${overview.walk_in_bookings.toLocaleString('vi-VN')} / ${overview.registered_customer_bookings.toLocaleString('vi-VN')}`}
          icon={TrendingUp}
          accent="violet"
        />
        <StatCard
          label="Thời lượng thực tế TB"
          value={`${overview.actual_duration_average_minutes || overview.scheduled_duration_average_minutes} ph`}
          icon={Clock}
          accent="amber"
          hint={`Đặt lịch trễ: ${overview.late_booking_count.toLocaleString('vi-VN')}`}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Xu hướng booking theo kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 1_000_000)}tr`}
                  />
                  <Tooltip
                    formatter={(value, name) =>
                      name === 'Doanh thu'
                        ? formatCurrency(Number(value))
                        : Number(value).toLocaleString('vi-VN')
                    }
                  />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    fill="#06b6a4"
                    radius={[6, 6, 0, 0]}
                    name="Booking"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: '#8b5cf6' }}
                    name="Doanh thu"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {trend.length} kỳ trong khoảng phân tích.{' '}
              {lastTrend
                ? `Kỳ gần nhất: ${lastTrend.count.toLocaleString('vi-VN')} booking.`
                : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Theo loại xe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleTypeStats}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {vehicleTypeStats.map((entry, index) => (
                      <Cell
                        key={entry.vehicle_type}
                        fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => Number(value).toLocaleString('vi-VN')}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]}>
                    {statusStats.map((_, index) => (
                      <Cell
                        key={index}
                        fill={STATUS_COLORS[index % STATUS_COLORS.length]}
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
            <CardTitle className="text-base">Phân bố theo khung giờ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeOfDayStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Bar dataKey="count" fill="#06b6a4" radius={[6, 6, 0, 0]} name="Booking" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Phân bố theo chi nhánh</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={garageStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} name="Booking" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tỉ lệ quan trọng</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Percent className="h-4 w-4 text-emerald-500" />
                Hoàn thành
              </span>
              <span className="text-lg font-semibold text-emerald-600">
                {completionRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Percent className="h-4 w-4 text-red-500" />
                Hủy
              </span>
              <span className="text-lg font-semibold text-red-600">
                {cancellationRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Percent className="h-4 w-4 text-orange-500" />
                Không đến
              </span>
              <span className="text-lg font-semibold text-orange-600">
                {overview.no_show_bookings.toLocaleString('vi-VN')} ({((overview.no_show_bookings / Math.max(overview.total_bookings, 1)) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm text-slate-600">
                <Car className="h-4 w-4 text-indigo-500" />
                Đổi lịch
              </span>
              <span className="text-lg font-semibold text-indigo-600">
                {overview.reschedule_count.toLocaleString('vi-VN')}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
