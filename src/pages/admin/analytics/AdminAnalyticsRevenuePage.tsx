import { Building2, CircleDollarSign, TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
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
  mockGarageRevenueStats,
  mockMonthlyRevenueStats,
} from '../../../mocks/adminAnalytics'
import { formatCurrency } from '../../../lib/utils'

const currentMonthRevenue =
  mockMonthlyRevenueStats[mockMonthlyRevenueStats.length - 1]?.revenue ?? 0
const topGarage = [...mockGarageRevenueStats].sort((a, b) => b.revenue - a.revenue)[0]

export function AdminAnalyticsRevenuePage() {
  const isLoading = useInitialPageSkeleton(260)

  if (isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Admin · Analytics"
        title="Doanh thu"
        description="Phân tích doanh thu theo tháng và theo garage trên toàn hệ thống (mock)."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Tổng doanh thu"
          value={formatCurrency(mockAnalyticsOverview.total_revenue)}
          icon={CircleDollarSign}
          accent="brand"
        />
        <StatCard
          label="Tháng hiện tại (T6)"
          value={formatCurrency(currentMonthRevenue)}
          icon={TrendingUp}
          accent="emerald"
        />
        <StatCard
          label="Garage dẫn đầu"
          value={topGarage?.garage_name ?? '—'}
          icon={Building2}
          accent="violet"
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Doanh thu 6 tháng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockMonthlyRevenueStats}>
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
            <CardTitle className="text-base">Doanh thu theo garage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockGarageRevenueStats} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${Math.round(value / 1_000_000)}tr`}
                  />
                  <YAxis
                    type="category"
                    dataKey="garage_name"
                    width={120}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết theo garage</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Garage</th>
                <th className="px-6 py-3">Booking</th>
                <th className="px-6 py-3">Doanh thu</th>
                <th className="px-6 py-3">TB / booking</th>
              </tr>
            </thead>
            <tbody>
              {mockGarageRevenueStats.map((row) => (
                <tr
                  key={row.garage_id}
                  className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-medium text-slate-900">{row.garage_name}</td>
                  <td className="px-6 py-4 text-slate-700">{row.bookings}</td>
                  <td className="px-6 py-4 font-medium text-brand-700">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {formatCurrency(Math.round(row.revenue / row.bookings))}
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
