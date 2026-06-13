import { Clock, Droplets, Gauge } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
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
import { mockWashBayPerformanceRows } from '../../../mocks/adminAnalytics'

const chartData = mockWashBayPerformanceRows.map((row) => ({
  name: row.bay_code,
  utilization: row.utilization_percent,
}))

const avgUtilization = Math.round(
  mockWashBayPerformanceRows.reduce((sum, row) => sum + row.utilization_percent, 0) /
    mockWashBayPerformanceRows.length,
)
const totalSessions = mockWashBayPerformanceRows.reduce(
  (sum, row) => sum + row.sessions_today,
  0,
)
const avgWait = Math.round(
  mockWashBayPerformanceRows.reduce((sum, row) => sum + row.avg_wait_minutes, 0) /
    mockWashBayPerformanceRows.length,
)

export function AdminAnalyticsWashBayPage() {
  const isLoading = useInitialPageSkeleton(260)

  if (isLoading) {
    return <DashboardPageSkeleton />
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Admin · Analytics"
        title="WashBay Performance"
        description="Hiệu suất sử dụng buồng rửa, phiên rửa trong ngày và thời gian chờ trung bình (mock)."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="TB sử dụng buồng"
          value={`${avgUtilization}%`}
          icon={Gauge}
          accent="brand"
        />
        <StatCard
          label="Phiên rửa hôm nay"
          value={totalSessions}
          icon={Droplets}
          accent="emerald"
        />
        <StatCard
          label="TB chờ (phút)"
          value={avgWait}
          icon={Clock}
          accent="amber"
        />
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Tỷ lệ sử dụng theo buồng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} unit="%" />
                <Tooltip formatter={(value) => [`${value}%`, 'Sử dụng']} />
                <Bar dataKey="utilization" fill="#06b6a4" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết buồng rửa</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Mã buồng</th>
                <th className="px-6 py-3">Tên</th>
                <th className="px-6 py-3">Garage</th>
                <th className="px-6 py-3">Sử dụng</th>
                <th className="px-6 py-3">Phiên hôm nay</th>
                <th className="px-6 py-3">TB phiên (phút)</th>
                <th className="px-6 py-3">TB chờ (phút)</th>
              </tr>
            </thead>
            <tbody>
              {mockWashBayPerformanceRows.map((row) => (
                <tr
                  key={row.bay_id}
                  className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-6 py-4 font-mono text-xs text-slate-700">{row.bay_code}</td>
                  <td className="px-6 py-4 font-medium text-slate-900">{row.bay_name}</td>
                  <td className="px-6 py-4 text-slate-600">{row.garage_name}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-brand-700">{row.utilization_percent}%</span>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{row.sessions_today}</td>
                  <td className="px-6 py-4 text-slate-700">{row.avg_session_minutes}</td>
                  <td className="px-6 py-4 text-slate-700">{row.avg_wait_minutes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
