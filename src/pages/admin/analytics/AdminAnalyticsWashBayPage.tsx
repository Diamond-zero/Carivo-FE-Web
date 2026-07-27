import { useEffect, useMemo } from 'react'
import {
  AlertTriangle,
  Clock,
  Droplets,
  Gauge,
  Timer,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { useAdminAnalyticsWashBays } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { formatCurrency } from '../../../lib/utils'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'

const VEHICLE_COLORS = ['#06b6a4', '#8b5cf6']
const UTIL_COLORS = ['#10b981', '#06b6a4', '#f59e0b', '#ef4444', '#0ea5e9', '#8b5cf6']

export function AdminAnalyticsWashBayPage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()

  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const { data, isLoading, isError, error } = useAdminAnalyticsWashBays(params)
  const raw = data?.raw as Record<string, unknown> | undefined

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được analytics buồng rửa.'), 'error')
    }
  }, [isError, error, showToast])

  if (isLoading || !data) {
    return <DashboardPageSkeleton />
  }

  const { metrics, rows, vehicleTypeSplit } = data
  const totalSessions = rows.reduce((sum, row) => sum + row.booking_count, 0)
  const totalMinutes = rows.reduce((sum, row) => sum + row.occupied_minutes, 0)
  const avgServiceMinutes =
    rows.length > 0
      ? Math.round(
          rows.reduce((sum, row) => sum + row.average_service_duration_minutes, 0) /
            rows.length,
        )
      : 0
  const totalRevenue = rows.reduce((sum, row) => sum + row.revenue, 0)
  const estUtilization = metrics.estimated_utilization
  const dataQualityNotes = Array.isArray(raw?.data_quality_notes)
    ? (raw?.data_quality_notes as unknown[]).filter(
        (value): value is string => typeof value === 'string',
      )
    : []

  const topUtilization = [...rows].sort(
    (a, b) => (b.estimated_utilization || 0) - (a.estimated_utilization || 0),
  )
  const utilizationChart = topUtilization.slice(0, 10).map((row) => ({
    name: row.bay_code,
    utilization: Number((row.estimated_utilization || 0).toFixed(1)),
  }))

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Hiệu suất buồng rửa"
        description="Tỉ lệ sử dụng, thời lượng dịch vụ và doanh thu theo từng buồng rửa trong khoảng thời gian đã chọn."
      />

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ước tính sử dụng"
          value={
            typeof estUtilization === 'number' && estUtilization > 0
              ? `${estUtilization.toFixed(1)}%`
              : '—'
          }
          icon={Gauge}
          accent="brand"
          hint={`${metrics.assigned_booking_count.toLocaleString('vi-VN')} booking đã phân buồng`}
        />
        <StatCard
          label="Phiên rửa"
          value={totalSessions.toLocaleString('vi-VN')}
          icon={Droplets}
          accent="emerald"
        />
        <StatCard
          label="Tổng thời gian vận hành"
          value={`${totalMinutes.toLocaleString('vi-VN')} ph`}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Thời lượng TB / phiên"
          value={`${avgServiceMinutes} ph`}
          icon={Timer}
          accent="violet"
          hint={`Doanh thu: ${formatCurrency(totalRevenue)}`}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Tỷ lệ sử dụng theo buồng</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Sử dụng']} />
                  <Bar dataKey="utilization" radius={[6, 6, 0, 0]}>
                    {utilizationChart.map((_, index) => (
                      <Cell
                        key={index}
                        fill={UTIL_COLORS[index % UTIL_COLORS.length]}
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
            <CardTitle className="text-base">Phân bổ theo loại xe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vehicleTypeSplit}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {vehicleTypeSplit.map((entry, index) => (
                      <Cell
                        key={entry.vehicle_type}
                        fill={VEHICLE_COLORS[index % VEHICLE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => Number(value).toLocaleString('vi-VN')}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết buồng rửa</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {rows.length === 0 ? (
            <p className="px-6 py-4 text-sm text-slate-500">
              Chưa có dữ liệu buồng rửa trong khoảng thời gian đã chọn.
            </p>
          ) : (
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Mã buồng</th>
                  <th className="px-6 py-3">Tên</th>
                  <th className="px-6 py-3">Chi nhánh</th>
                  <th className="px-6 py-3">Phiên</th>
                  <th className="px-6 py-3">Sử dụng</th>
                  <th className="px-6 py-3">Phút vận hành</th>
                  <th className="px-6 py-3">Phút / phiên</th>
                  <th className="px-6 py-3">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.bay_id}
                    className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      {row.bay_code}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">{row.bay_name}</td>
                    <td className="px-6 py-4 text-slate-600">{row.garage_name}</td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.booking_count.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-brand-700">
                        {row.estimated_utilization
                          ? `${row.estimated_utilization.toFixed(1)}%`
                          : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.occupied_minutes.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {row.average_service_duration_minutes.toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {formatCurrency(row.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {dataQualityNotes.length > 0 ? (
        <div className="carivo-panel mt-6 flex items-start gap-3 bg-amber-50/60 p-4 text-amber-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="space-y-1 text-sm">
            {dataQualityNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
