import { eachDayOfInterval, format, subDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import { useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  CalendarCheck,
  CircleAlert,
  CircleDollarSign,
  Percent,
  Users,
} from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Legend,
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
import { BookingStatusBadge } from '../../../components/booking/BookingStatusBadge'
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
import { LOYALTY_TIER_LABELS } from '../../../constants/loyaltyTier'
import { formatCurrency } from '../../../lib/utils'
import type { LoyaltyTier } from '../../../types/loyalty'
import { getAdminBookingCustomerName } from '../../../utils/adminBooking'

const TIER_ORDER: LoyaltyTier[] = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']

const TIER_COLORS: Record<LoyaltyTier, string> = {
  BRONZE: '#CD7F32',
  SILVER: '#94a3b8',
  GOLD: '#eab308',
  PLATINUM: '#8b5cf6',
}

function createDashboardPeriod() {
  const today = new Date()
  const start = subDays(today, 6)
  const days = eachDayOfInterval({ start, end: today })
  const fromDate = format(start, 'yyyy-MM-dd')
  const toDate = format(today, 'yyyy-MM-dd')

  return {
    days,
    fromDate,
    toDate,
    query: {
      from: `${fromDate}T00:00:00.000+07:00`,
      to: `${toDate}T23:59:59.999+07:00`,
      group_by: 'DAY' as const,
    },
  }
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

export function AdminDashboardPage() {
  const { showToast } = useToast()
  const dashboardPeriod = useMemo(() => createDashboardPeriod(), [])
  const overviewQuery = useAdminAnalyticsOverview()
  const bookingTrendQuery = useAdminAnalyticsBookings(dashboardPeriod.query)
  const revenueTrendQuery = useAdminAnalyticsRevenue(dashboardPeriod.query)
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
  const dailyStats = useMemo(() => {
    const bookingsByDay = new Map(
      (bookingTrendQuery.data?.trend ?? []).map((row) => [
        row.period,
        row.count,
      ]),
    )
    const revenueByDay = new Map(
      (revenueTrendQuery.data?.trend ?? []).map((row) => [
        row.period,
        row.revenue,
      ]),
    )

    return dashboardPeriod.days.map((day) => {
      const period = format(day, 'yyyy-MM-dd')
      return {
        date: period,
        label: format(day, 'dd/MM'),
        bookings: bookingsByDay.get(period) ?? 0,
        revenue: revenueByDay.get(period) ?? 0,
      }
    })
  }, [
    bookingTrendQuery.data?.trend,
    dashboardPeriod.days,
    revenueTrendQuery.data?.trend,
  ])
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
          <CardHeader>
            <CardTitle>Booking và doanh thu 7 ngày gần đây</CardTitle>
            <CardDescription>
              Từ {format(dashboardPeriod.days[0], 'dd/MM/yyyy')} đến{' '}
              {format(dashboardPeriod.days.at(-1)!, 'dd/MM/yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyStats}>
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
                    formatter={(value, name) =>
                      name === 'Doanh thu'
                        ? formatCurrency(Number(value))
                        : Number(value).toLocaleString('vi-VN')
                    }
                  />
                  <Legend />
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
