import { Building2, CircleDollarSign, Gauge, Star, Users } from 'lucide-react'
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
import { useAdminAnalyticsGarages } from '../../../hooks/api/admin/useAdminAnalytics'
import { formatCurrency } from '../../../lib/utils'

export function AdminAnalyticsGaragesPage() {
  const { showToast } = useToast()
  const { data, isLoading, isError, error } = useAdminAnalyticsGarages()
  const rows = data?.rows ?? []

  useEffect(() => {
    if (isError) {
      showToast(
        getApiErrorMessage(error, 'Không tải được analytics chi nhánh.'),
        'error',
      )
    }
  }, [isError, error, showToast])

  if (isLoading) return <DashboardPageSkeleton />

  const totalRevenue = rows.reduce((sum, row) => sum + row.total_revenue, 0)
  const totalBookings = rows.reduce((sum, row) => sum + row.total_bookings, 0)
  const totalCustomers = rows.reduce((sum, row) => sum + row.customer_count, 0)
  const avgUtilization =
    rows.length > 0
      ? Math.round(rows.reduce((sum, row) => sum + row.utilization_percent, 0) / rows.length)
      : 0

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Hiệu suất chi nhánh"
        description="Tổng quan doanh thu, booking và sử dụng buồng rửa của từng chi nhánh trên toàn hệ thống."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng chi nhánh"
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
          value={totalBookings}
          icon={Users}
          accent="violet"
        />
        <StatCard
          label="TB sử dụng"
          value={`${avgUtilization}%`}
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
              <BarChart data={rows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="garage_name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value as number), 'Doanh thu']}
                />
                <Bar dataKey="total_revenue" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
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
              Chưa có dữ liệu chi nhánh.
            </p>
          ) : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Chi nhánh</th>
                  <th className="px-6 py-3">Booking</th>
                  <th className="px-6 py-3">Doanh thu</th>
                  <th className="px-6 py-3">Sử dụng</th>
                  <th className="px-6 py-3">Khách hàng</th>
                  <th className="px-6 py-3">Đánh giá</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => (
                  <tr key={row.garage_id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {row.garage_name}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.total_bookings.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(row.total_revenue)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-brand-700">
                        {row.utilization_percent}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.customer_count.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.average_rating !== undefined && row.average_rating > 0 ? (
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          {row.average_rating.toFixed(1)}
                        </span>
                      ) : (
                        '—'
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
  )
}