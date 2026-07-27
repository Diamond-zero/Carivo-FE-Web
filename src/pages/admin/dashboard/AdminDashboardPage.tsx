import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useEffect } from 'react'
import {
  CalendarCheck,
  CircleDollarSign,
  Percent,
  Users,
} from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { getApiErrorMessage } from '../../../api/client'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAnalyticsBookings, useAdminAnalyticsOverview } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAdminRecentBookings } from '../../../hooks/api/admin/useAdminBookings'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { formatCurrency } from '../../../lib/utils'
import { getAdminBookingCustomerName } from '../../../utils/adminBooking'

const TIER_COLORS = ['#94a3b8', '#06b6a4', '#f59e0b', '#8b5cf6']

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const overviewQuery = useAdminAnalyticsOverview()
  const bookingTrendQuery = useAdminAnalyticsBookings({ group_by: 'DAY' })
  const recentBookingsQuery = useAdminRecentBookings(5)

  const isLoading =
    overviewQuery.isLoading ||
    bookingTrendQuery.isLoading ||
    recentBookingsQuery.isLoading
  const overview = overviewQuery.data?.overview
  const dailyStats = (bookingTrendQuery.data?.trend ?? []).map((row) => ({
    date: row.period,
    label: row.label,
    bookings: row.count,
    revenue: row.revenue,
  }))
  const recentBookings = recentBookingsQuery.data ?? []

  useEffect(() => {
    if (overviewQuery.isError) {
      showToast(
        getApiErrorMessage(overviewQuery.error, 'Không tải được dữ liệu dashboard.'),
        'error',
      )
    }
  }, [overviewQuery.isError, overviewQuery.error, showToast])

  useEffect(() => {
    if (recentBookingsQuery.isError) {
      showToast(
        getApiErrorMessage(recentBookingsQuery.error, 'Không tải được booking gần đây.'),
        'error',
      )
    }
  }, [recentBookingsQuery.isError, recentBookingsQuery.error, showToast])

  useEffect(() => {
    if (bookingTrendQuery.isError) {
      showToast(
        getApiErrorMessage(bookingTrendQuery.error, 'Không tải được xu hướng booking.'),
        'error',
      )
    }
  }, [bookingTrendQuery.isError, bookingTrendQuery.error, showToast])

  if (isLoading || !overview) {
    return <DashboardPageSkeleton />
  }

  const tierChartData = Object.entries(overview.tier_distribution).map(([tier, value]) => ({
    name: LOYALTY_TIER_LABELS[tier as keyof typeof LOYALTY_TIER_LABELS],
    value,
  }))

  const completionRate = Math.round(overview.completion_rate || 0)

  const last7Days = dailyStats.slice(-7)

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Bảng điều khiển"
        description="Theo dõi booking, doanh thu và phân bố khách hàng loyalty trên toàn hệ thống Carivo."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng booking"
          value={overview.total_bookings.toLocaleString('vi-VN')}
          icon={CalendarCheck}
          accent="brand"
        />
        <StatCard
          label="Doanh thu"
          value={formatCurrency(overview.total_revenue)}
          icon={CircleDollarSign}
          accent="emerald"
        />
        <StatCard
          label="Khách đang hoạt động"
          value={overview.unique_registered_customers.toLocaleString('vi-VN')}
          icon={Users}
          accent="indigo"
        />
        <StatCard
          label="Tỷ lệ hoàn thành"
          value={`${completionRate}%`}
          icon={Percent}
          accent="violet"
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Đặt lịch 7 ngày gần nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={last7Days}>
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
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="bookings"
                    stroke="#06b6a4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6a4' }}
                    name="Đặt lịch"
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
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bố hạng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tierChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {tierChartData.map((_, index) => (
                      <Cell key={index} fill={TIER_COLORS[index % TIER_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Đặt lịch mới nhất</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Mã</th>
                <th className="px-6 py-3">Khách</th>
                <th className="px-6 py-3">Chi nhánh</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Giá</th>
                <th className="px-6 py-3">Giờ hẹn</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {booking.id.replace('booking-', 'BK-')}
                  </td>
                  <td className="px-6 py-4 text-slate-700">
                    {getAdminBookingCustomerName(booking)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">{booking.garage_id}</td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{booking.status}</Badge>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {formatCurrency(booking.final_price)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {format(new Date(booking.start_time), 'dd/MM/yyyy HH:mm', {
                      locale: vi,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
