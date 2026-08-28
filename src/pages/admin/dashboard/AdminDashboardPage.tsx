import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  CircleAlert,
  CircleDollarSign,
  Download,
  Percent,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react'
import {
  Bar,
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
import { PageHeader } from '../../../components/layout/PageHeader'
import { BookingStatusBadge } from '../../../components/booking/BookingStatusBadge'
import { AdminAnalyticsFiltersPanel } from '../../../components/admin/analytics/AdminAnalyticsFiltersPanel'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { CopyValueButton } from '../../../components/ui/CopyValueButton'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Button } from '../../../components/ui/Button'
import { StatCard } from '../../../components/ui/StatCard'
import { getApiErrorMessage } from '../../../api/client'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminAnalyticsBookings,
  useAdminAnalyticsOverview,
  useAdminAnalyticsRevenue,
} from '../../../hooks/api/admin/useAdminAnalytics'
import { useAdminUpcomingBookings } from '../../../hooks/api/admin/useAdminBookings'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { formatCurrency } from '../../../lib/utils'
import type { LoyaltyTier } from '../../../types/loyalty'
import { getAdminBookingCustomerName } from '../../../utils/adminBooking'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'
import { exportDashboardReportToCsv } from '../../../utils/exportAnalytics'
import {
  generateForecastData,
  type ForecastHorizon,
} from '../../../utils/analyticsForecasting'

const TIER_ORDER: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

const TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#94a3b8',
  GOLD: '#eab308',
  PLATINUM: '#8b5cf6',
}

function formatRevenueAxis(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', {
      maximumFractionDigits: 1,
    })}tr`
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000).toLocaleString('vi-VN')}k`
  }
  return value.toLocaleString('vi-VN')
}

function formatPeriodLabel(period: string) {
  // YYYY-MM-DD (e.g. 2026-08-28) -> 28/08
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    const [, month, day] = period.split('-')
    return `${day}/${month}`
  }
  // YYYY-MM (e.g. 2026-08) -> T08/2026
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split('-')
    return `T${month}/${year}`
  }
  // YYYY-Wxx (e.g. 2026-W34) -> Tuần 34
  if (/^\d{4}-W\d{2}$/.test(period)) {
    const [, week] = period.split('-W')
    return `Tuần ${week}`
  }
  // YYYY (e.g. 2026) -> Năm 2026
  if (/^\d{4}$/.test(period)) {
    return `Năm ${period}`
  }
  return period
}

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()
  const [isForecastEnabled, setIsForecastEnabled] = useState(false)
  const [forecastHorizon, setForecastHorizon] = useState<ForecastHorizon>('YEAR_2027')

  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const overviewQuery = useAdminAnalyticsOverview(params)
  const bookingTrendQuery = useAdminAnalyticsBookings(params)
  const revenueTrendQuery = useAdminAnalyticsRevenue(params)
  const upcomingBookingsQuery = useAdminUpcomingBookings(5)
  const garagesQuery = useAdminGarages()
  const { allGarages } = garagesQuery
  const garageNameById = useMemo(
    () => new Map(allGarages.map((garage) => [garage.id, garage.name])),
    [allGarages],
  )

  const isLoading =
    overviewQuery.isLoading ||
    bookingTrendQuery.isLoading ||
    revenueTrendQuery.isLoading ||
    garagesQuery.isLoading ||
    upcomingBookingsQuery.isLoading
  const overview = overviewQuery.data?.overview

  const trendStats = useMemo(() => {
    const bookingsByPeriod = new Map(
      (bookingTrendQuery.data?.trend ?? []).map((row) => [
        row.period,
        row.count,
      ]),
    )
    const revenueByPeriod = new Map(
      (revenueTrendQuery.data?.trend ?? []).map((row) => [
        row.period,
        row.revenue,
      ]),
    )

    const allPeriods = Array.from(
      new Set([
        ...(bookingTrendQuery.data?.trend ?? []).map((row) => row.period),
        ...(revenueTrendQuery.data?.trend ?? []).map((row) => row.period),
      ]),
    ).sort()

    return allPeriods.map((period) => ({
      period,
      label: formatPeriodLabel(period),
      bookings: bookingsByPeriod.get(period) ?? 0,
      revenue: revenueByPeriod.get(period) ?? 0,
    }))
  }, [bookingTrendQuery.data?.trend, revenueTrendQuery.data?.trend])

  const { combinedStats: chartData, summary: forecastSummary } = useMemo(() => {
    if (!isForecastEnabled) {
      return { combinedStats: trendStats, summary: null }
    }
    return generateForecastData(trendStats, forecastHorizon)
  }, [isForecastEnabled, trendStats, forecastHorizon])

  const handleExportReport = () => {
    try {
      exportDashboardReportToCsv({
        overview: overview ? {
          total_bookings: overview.total_bookings,
          total_revenue: overview.total_revenue,
          unique_registered_customers: overview.unique_registered_customers,
          completion_rate: overview.completion_rate,
        } : undefined,
        trendStats,
        filters,
      })
      showToast('Đã xuất file báo cáo thành công!', 'success')
    } catch {
      showToast('Không thể xuất file báo cáo. Vui lòng thử lại.', 'error')
    }
  }

  const upcomingBookings = upcomingBookingsQuery.data ?? []

  useEffect(() => {
    if (overviewQuery.isError) {
      showToast(
        getApiErrorMessage(overviewQuery.error, 'Không tải được dữ liệu dashboard.'),
        'error',
      )
    }
  }, [overviewQuery.isError, overviewQuery.error, showToast])

  useEffect(() => {
    if (upcomingBookingsQuery.isError) {
      showToast(
        getApiErrorMessage(
          upcomingBookingsQuery.error,
          'Không tải được lịch hẹn sắp tới.',
        ),
        'error',
      )
    }
  }, [upcomingBookingsQuery.isError, upcomingBookingsQuery.error, showToast])

  useEffect(() => {
    if (bookingTrendQuery.isError) {
      showToast(
        getApiErrorMessage(bookingTrendQuery.error, 'Không tải được xu hướng booking.'),
        'error',
      )
    }
  }, [bookingTrendQuery.isError, bookingTrendQuery.error, showToast])

  useEffect(() => {
    if (revenueTrendQuery.isError) {
      showToast(
        getApiErrorMessage(
          revenueTrendQuery.error,
          'Không tải được xu hướng doanh thu.',
        ),
        'error',
      )
    }
  }, [revenueTrendQuery.isError, revenueTrendQuery.error, showToast])

  useEffect(() => {
    if (garagesQuery.isError) {
      showToast(
        getApiErrorMessage(
          garagesQuery.error,
          'Không tải được tên chi nhánh.',
        ),
        'error',
      )
    }
  }, [garagesQuery.isError, garagesQuery.error, showToast])

  if (isLoading) {
    return <DashboardPageSkeleton />
  }

  if (overviewQuery.isError || !overview) {
    return (
      <div>
        <PageHeader
          eyebrow="Carivo Quản trị"
          title="Bảng điều khiển"
          description="Theo dõi booking, doanh thu và phân bố khách hàng loyalty trên toàn hệ thống Carivo."
        />
        <AdminAnalyticsFiltersPanel
          filters={filters}
          onChange={setFilters}
          onReset={reset}
          showServicePackage={false}
          showVehicleType={false}
        />
        <Card>
          <EmptyState
            icon={CircleAlert}
            title="Không thể tải bảng điều khiển"
            description={getApiErrorMessage(
              overviewQuery.error,
              'Dữ liệu tổng quan hiện không khả dụng.',
            )}
            action={
              <Button onClick={() => void overviewQuery.refetch()}>
                Thử lại
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const tierChartData = TIER_ORDER.map((tier) => ({
    tier,
    name: LOYALTY_TIER_LABELS[tier],
    value: overview.tier_distribution[tier] ?? 0,
  }))
  const tierCustomerTotal = tierChartData.reduce(
    (total, item) => total + item.value,
    0,
  )

  const completionRate = Math.round(overview.completion_rate || 0)

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          eyebrow="Carivo Quản trị"
          title="Bảng điều khiển"
          description="Theo dõi booking, doanh thu và phân bố khách hàng loyalty trên toàn hệ thống Carivo."
        />
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportReport}
            className="gap-1.5 shadow-sm"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            Xuất báo cáo
          </Button>
        </div>
      </div>

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
        showServicePackage={false}
        showVehicleType={false}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng booking"
          value={overview.total_bookings.toLocaleString('vi-VN')}
          icon={CalendarCheck}
          accent="brand"
          hint="Toàn hệ thống"
        />
        <StatCard
          label="Doanh thu"
          value={formatCurrency(overview.total_revenue)}
          icon={CircleDollarSign}
          accent="emerald"
          hint="Từ các booking đã thanh toán"
        />
        <StatCard
          label="Khách đã đặt lịch"
          value={overview.unique_registered_customers.toLocaleString('vi-VN')}
          icon={Users}
          accent="indigo"
          hint="Tài khoản customer có booking"
        />
        <StatCard
          label="Tỷ lệ hoàn thành"
          value={`${completionRate}%`}
          icon={Percent}
          accent="violet"
          hint="Trên tổng booking"
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-3 pb-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Xu hướng booking và doanh thu</CardTitle>
              <CardDescription>
                Theo dõi biến động lượt đặt lịch và doanh thu theo thời gian đã chọn
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isForecastEnabled ? (
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setForecastHorizon('YEAR_2027')}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                      forecastHorizon === 'YEAR_2027'
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Đến năm 2027
                  </button>
                  <button
                    type="button"
                    onClick={() => setForecastHorizon('NEXT_PERIOD')}
                    className={`rounded-md px-2.5 py-1 font-medium transition-colors ${
                      forecastHorizon === 'NEXT_PERIOD'
                        ? 'bg-white text-brand-700 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    1 kỳ tới
                  </button>
                </div>
              ) : null}
              <Button
                variant={isForecastEnabled ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setIsForecastEnabled(!isForecastEnabled)}
                className="gap-1.5 text-xs font-medium"
              >
                <Sparkles className={`h-3.5 w-3.5 ${isForecastEnabled ? 'text-amber-300' : 'text-amber-500'}`} />
                {isForecastEnabled ? 'Đang bật dự báo' : 'Dự báo xu hướng'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isForecastEnabled && forecastSummary ? (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs text-amber-900">
                <TrendingUp className="h-4 w-4 shrink-0 text-amber-600" />
                <span>
                  <strong>Dự báo {forecastSummary.periodLabel}:</strong> Ước tính đạt khoảng{' '}
                  <strong className="text-emerald-700">{forecastSummary.estimatedBookings.toLocaleString('vi-VN')} lượt đặt lịch</strong> (
                  {forecastSummary.bookingGrowthRate >= 0 ? '+' : ''}
                  {forecastSummary.bookingGrowthRate}%) và{' '}
                  <strong className="text-purple-700">{formatCurrency(forecastSummary.estimatedRevenue)}</strong> (
                  {forecastSummary.revenueGrowthRate >= 0 ? '+' : ''}
                  {forecastSummary.revenueGrowthRate}% so với kỳ trước).
                </span>
              </div>
            ) : null}

            <div className="h-72">
              {chartData.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <CircleDollarSign className="h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Chưa có dữ liệu xu hướng trong khoảng thời gian này
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                    <YAxis
                      yAxisId="left"
                      allowDecimals={false}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) => formatRevenueAxis(Number(value))}
                    />
                    <Tooltip
                      formatter={(value, name) => {
                        if (name === 'Doanh thu' || name === 'Doanh thu dự báo') {
                          return formatCurrency(Number(value))
                        }
                        return `${Number(value).toLocaleString('vi-VN')} lượt`
                      }}
                    />
                    <Legend />
                    <Bar
                      yAxisId="right"
                      dataKey="revenue"
                      fill="#8b5cf6"
                      radius={[4, 4, 0, 0]}
                      name="Doanh thu"
                      maxBarSize={48}
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
                    {isForecastEnabled ? (
                      <>
                        <Line
                          yAxisId="right"
                          type="monotone"
                          dataKey="forecastRevenue"
                          stroke="#f59e0b"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 4, fill: '#f59e0b' }}
                          name="Doanh thu dự báo"
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="forecastBookings"
                          stroke="#e11d48"
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 4, fill: '#e11d48' }}
                          name="Đặt lịch dự báo"
                        />
                      </>
                    ) : null}
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Phân bố hạng</CardTitle>
            <CardDescription>
              {tierCustomerTotal.toLocaleString('vi-VN')} tài khoản loyalty
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {tierCustomerTotal === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Users className="h-8 w-8 text-slate-300" />
                  <p className="mt-3 text-sm font-medium text-slate-600">
                    Chưa có dữ liệu hạng thành viên
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Phân bố sẽ xuất hiện khi khách hàng có tài khoản loyalty.
                  </p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="44%"
                      innerRadius={48}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {tierChartData.map((item) => (
                        <Cell key={item.tier} fill={TIER_COLORS[item.tier]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        `${Number(value).toLocaleString('vi-VN')} khách`
                      }
                    />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lịch hẹn sắp tới</CardTitle>
          <CardDescription>
            5 booking có giờ hẹn gần nhất trên toàn hệ thống
          </CardDescription>
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
              {upcomingBookings.length === 0 ? (
                <tr>
                  <td
                    className="px-6 py-10 text-center text-sm text-slate-500"
                    colSpan={6}
                  >
                    Hiện chưa có lịch hẹn sắp tới.
                  </td>
                </tr>
              ) : (
                upcomingBookings.map((booking) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-100/80 last:border-0 hover:bg-slate-50/50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Link
                          to={`/admin/bookings/${booking.id}`}
                          className="carivo-link font-mono text-xs font-semibold"
                        >
                          {booking.id.replace('booking-', 'BK-')}
                        </Link>
                        <CopyValueButton
                          value={booking.id}
                          label="mã booking"
                          className="text-slate-500"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {getAdminBookingCustomerName(booking)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {garageNameById.get(booking.garage_id) ?? booking.garage_id}
                    </td>
                    <td className="px-6 py-4">
                      <BookingStatusBadge status={booking.status} />
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
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
