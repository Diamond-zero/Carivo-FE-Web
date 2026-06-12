import { CalendarCheck, Car, Percent } from 'lucide-react'
import {
  Bar,
  BarChart,
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
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useInitialPageSkeleton } from '../../../hooks/useInitialPageSkeleton'
import {
  mockAnalyticsOverview,
  mockBookingStatusStats,
  mockDailyBookingStats,
  mockVehicleTypeBookingStats,
} from '../../../mocks/adminAnalytics'
import { formatCurrency } from '../../../lib/utils'

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

const completionRate = Math.round(
  (mockAnalyticsOverview.completed_bookings / mockAnalyticsOverview.total_bookings) * 100,
)
const weeklyBookings = mockDailyBookingStats.reduce((sum, item) => sum + item.bookings, 0)
const weeklyRevenue = mockDailyBookingStats.reduce((sum, item) => sum + item.revenue, 0)

export function AdminAnalyticsBookingsPage() {
  const isLoading = useInitialPageSkeleton(260)

  if (isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Admin · Analytics"
        title="Bookings"
        description="Thống kê lượt đặt, tỷ lệ hoàn thành và xu hướng 7 ngày gần nhất (mock)."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng booking"
          value={mockAnalyticsOverview.total_bookings.toLocaleString('vi-VN')}
          icon={CalendarCheck}
          accent="brand"
        />
        <StatCard
          label="Hoàn thành"
          value={mockAnalyticsOverview.completed_bookings.toLocaleString('vi-VN')}
          icon={CalendarCheck}
          accent="emerald"
        />
        <StatCard
          label="Tỷ lệ hoàn thành"
          value={`${completionRate}%`}
          icon={Percent}
          accent="violet"
        />
        <StatCard
          label="7 ngày — doanh thu"
          value={formatCurrency(weeklyRevenue)}
          icon={Car}
          accent="amber"
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Booking & doanh thu 7 ngày</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockDailyBookingStats}>
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
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Tổng {weeklyBookings} booking trong 7 ngày qua.
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
                    data={mockVehicleTypeBookingStats}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {mockVehicleTypeBookingStats.map((_, index) => (
                      <Cell
                        key={index}
                        fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]}
                      />
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
          <CardTitle className="text-base">Phân bố theo trạng thái</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockBookingStatusStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]}>
                  {mockBookingStatusStats.map((_, index) => (
                    <Cell key={index} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
