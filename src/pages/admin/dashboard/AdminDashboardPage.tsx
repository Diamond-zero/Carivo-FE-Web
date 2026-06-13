import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
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
import { StatCard } from '../../../components/ui/StatCard'
import {
  mockAnalyticsOverview,
  mockDailyBookingStats,
  mockRecentAdminBookings,
} from '../../../mocks/adminAnalytics'
import { formatCurrency } from '../../../lib/utils'

const TIER_COLORS = ['#94a3b8', '#06b6a4', '#f59e0b', '#8b5cf6']
const TIER_LABELS = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
}

const tierChartData = Object.entries(mockAnalyticsOverview.tier_distribution).map(
  ([tier, value]) => ({
    name: TIER_LABELS[tier as keyof typeof TIER_LABELS],
    value,
  }),
)

const completionRate = Math.round(
  (mockAnalyticsOverview.completed_bookings / mockAnalyticsOverview.total_bookings) *
    100,
)

export function AdminDashboardPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Carivo Admin"
        title="Dashboard tổng quan"
        description="Theo dõi booking, doanh thu và phân bố khách hàng loyalty trên toàn hệ thống Carivo."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng booking"
          value={mockAnalyticsOverview.total_bookings.toLocaleString('vi-VN')}
          icon={CalendarCheck}
          accent="brand"
        />
        <StatCard
          label="Doanh thu"
          value={formatCurrency(mockAnalyticsOverview.total_revenue)}
          icon={CircleDollarSign}
          accent="emerald"
        />
        <StatCard
          label="Khách active"
          value={mockAnalyticsOverview.active_customers}
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
            <CardTitle>Booking 7 ngày gần nhất</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockDailyBookingStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="bookings"
                    stroke="#06b6a4"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#06b6a4' }}
                    name="Booking"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bố tier</CardTitle>
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
          <CardTitle>Booking mới nhất</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Mã</th>
                <th className="px-6 py-3">Khách</th>
                <th className="px-6 py-3">Garage</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Giá</th>
                <th className="px-6 py-3">Giờ hẹn</th>
              </tr>
            </thead>
            <tbody>
              {mockRecentAdminBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {booking.code}
                  </td>
                  <td className="px-6 py-4 text-slate-700">{booking.customer_name}</td>
                  <td className="px-6 py-4 text-slate-600">{booking.garage_name}</td>
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
