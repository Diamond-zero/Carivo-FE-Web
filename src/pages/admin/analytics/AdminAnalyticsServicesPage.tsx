import { CircleDollarSign, Package, ShoppingBag, Users } from 'lucide-react'
import { useEffect } from 'react'
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
import { PageHeader } from '../../../components/layout/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAnalyticsServices } from '../../../hooks/api/admin/useAdminAnalytics'
import { formatCurrency } from '../../../lib/utils'

export function AdminAnalyticsServicesPage() {
  const { showToast } = useToast()
  const { data, isLoading, isError, error } = useAdminAnalyticsServices()
  const rows = data?.rows ?? []

  useEffect(() => {
    if (isError) {
      showToast(
        getApiErrorMessage(error, 'Không tải được analytics dịch vụ.'),
        'error',
      )
    }
  }, [isError, error, showToast])

  if (isLoading) return <DashboardPageSkeleton />

  const totalBookings = rows.reduce((sum, row) => sum + row.total_bookings, 0)
  const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0)
  const topService = [...rows].sort((a, b) => b.total_revenue - a.total_revenue)[0]
  const satisfactionScores = rows.filter(
    (row) => row.customer_satisfaction !== undefined && row.customer_satisfaction > 0,
  )
  const avgSatisfaction =
    satisfactionScores.length > 0
      ? (
          satisfactionScores.reduce(
            (sum, row) => sum + (row.customer_satisfaction ?? 0),
            0,
          ) / satisfactionScores.length
        ).toFixed(1)
      : '—'

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Hiệu suất gói dịch vụ"
        description="Phân tích booking, doanh thu và mức độ hài lòng của khách theo từng gói dịch vụ."
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
          label="Hài lòng TB"
          value={avgSatisfaction}
          icon={Users}
          accent="amber"
        />
      </div>

      {topService ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">Top dịch vụ doanh thu cao nhất</CardTitle>
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
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="service_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'Doanh thu']}
                />
                <Bar dataKey="total_revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
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
              Chưa có dữ liệu gói dịch vụ.
            </p>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Gói dịch vụ</th>
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Doanh thu</th>
                  <th className="px-6 py-3">Giá TB</th>
                  <th className="px-6 py-3">Hài lòng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.service_package_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.service_name}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.total_bookings.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(row.total_revenue)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {formatCurrency(row.average_price)}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.customer_satisfaction !== undefined &&
                      row.customer_satisfaction > 0
                        ? row.customer_satisfaction.toFixed(1)
                        : '—'}
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