import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  CalendarDays,
  Repeat2,
  Trophy,
  UserPlus,
  Users,
  WalletCards,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
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
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { CopyValueButton } from '../../../components/ui/CopyValueButton'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import { useAdminAnalyticsCustomers } from '../../../hooks/api/admin/useAdminAnalytics'
import { useAnalyticsFilters } from '../../../hooks/useAnalyticsFilters'
import { formatCurrency } from '../../../lib/utils'
import type {
  AnalyticsCustomerRankingRow,
  AnalyticsCustomerTopLists,
} from '../../../types/adminAnalytics'
import { analyticsFiltersToParams } from '../../../utils/adminAnalyticsFilters'
import { formatDateTime } from '../../../utils/format'

type RankingKey = keyof AnalyticsCustomerTopLists

const BOOKING_MIX_COLORS = ['#f59e0b', '#06b6a4']
const ACTIVITY_COLORS = ['#94a3b8', '#6366f1', '#10b981']

const RANKING_OPTIONS: Array<{
  key: RankingKey
  label: string
  description: string
}> = [
  {
    key: 'by_visits',
    label: 'Nhiều lượt nhất',
    description: 'Xếp theo số lượt hoàn thành và đã thanh toán.',
  },
  {
    key: 'by_spending',
    label: 'Chi tiêu cao nhất',
    description: 'Xếp theo tổng doanh thu thực thu từ customer.',
  },
  {
    key: 'by_service_variety',
    label: 'Đa dạng dịch vụ',
    description: 'Xếp theo số gói dịch vụ chính khác nhau đã sử dụng.',
  },
  {
    key: 'single_service_repeat',
    label: 'Trung thành một dịch vụ',
    description:
      'Chỉ dùng một gói chính và đã quay lại ít nhất hai lần trong phạm vi đang lọc.',
  },
]

function CustomerRankingTable({
  rows,
  ranking,
}: {
  rows: AnalyticsCustomerRankingRow[]
  ranking: RankingKey
}) {
  if (rows.length === 0) {
    return (
      <p className="px-6 py-12 text-center text-sm text-slate-500">
        Chưa có customer phù hợp với bộ lọc và tiêu chí này.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[920px] text-left text-sm">
        <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-3">#</th>
            <th className="px-5 py-3">Customer</th>
            <th className="px-5 py-3 text-right">Lượt trả phí</th>
            <th className="px-5 py-3 text-right">Tổng chi tiêu</th>
            <th className="px-5 py-3 text-right">Giá trị TB</th>
            <th className="px-5 py-3 text-right">Số loại dịch vụ</th>
            <th className="px-5 py-3">Dịch vụ yêu thích</th>
            <th className="px-5 py-3">Lần gần nhất</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={`${ranking}-${row.customer_id}`}
              className="border-b border-slate-100/80 hover:bg-slate-50/50"
            >
              <td className="px-5 py-4 font-semibold text-slate-500">{index + 1}</td>
              <td className="px-5 py-4">
                <Link
                  to={`/admin/users/customers/${row.customer_id}`}
                  className="font-medium text-cyan-700 hover:text-cyan-800"
                >
                  {row.full_name}
                </Link>
                <p className="mt-1 text-xs text-slate-500">
                  {row.is_active ? 'Tài khoản đang hoạt động' : 'Tài khoản đã khóa'}
                </p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <span
                    className="max-w-32 truncate font-mono"
                    title={row.customer_id}
                  >
                    {row.customer_id}
                  </span>
                  <CopyValueButton
                    value={row.customer_id}
                    label="ID customer"
                    className="text-slate-500"
                  />
                </div>
              </td>
              <td className="px-5 py-4 text-right font-medium text-slate-900">
                {row.total_visits.toLocaleString('vi-VN')}
              </td>
              <td className="px-5 py-4 text-right text-slate-700">
                {formatCurrency(row.total_spent)}
              </td>
              <td className="px-5 py-4 text-right text-slate-700">
                {formatCurrency(row.average_order_value)}
              </td>
              <td className="px-5 py-4 text-right text-slate-700">
                {row.distinct_service_count.toLocaleString('vi-VN')}
              </td>
              <td className="px-5 py-4 text-slate-700">
                <p className="font-medium text-slate-900">{row.favorite_service.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {row.favorite_service.usage_count.toLocaleString('vi-VN')} lần
                </p>
              </td>
              <td className="px-5 py-4 text-slate-600">
                {row.last_visit_at ? formatDateTime(row.last_visit_at) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminAnalyticsCustomersPage() {
  const { showToast } = useToast()
  const { filters, setFilters, reset } = useAnalyticsFilters()
  const [ranking, setRanking] = useState<RankingKey>('by_visits')
  const params = useMemo(() => analyticsFiltersToParams(filters), [filters])
  const { data, isLoading, isError, error } = useAdminAnalyticsCustomers(params)

  useEffect(() => {
    if (isError) {
      showToast(getApiErrorMessage(error, 'Không tải được analytics customer.'), 'error')
    }
  }, [isError, error, showToast])

  if (isLoading || !data) {
    return <DashboardPageSkeleton />
  }

  const {
    accountMetrics,
    funnel,
    registrationTrend,
    bookingMix,
    valueMetrics,
    activityDistribution,
    topCustomers,
  } = data
  const bookingMixData = [
    {
      key: 'WALK_IN',
      label: 'Vãng lai',
      count: bookingMix.walk_in.bookings,
    },
    {
      key: 'REGISTERED',
      label: 'Customer',
      count: bookingMix.registered_customer.bookings,
    },
  ]
  const selectedRanking =
    RANKING_OPTIONS.find((option) => option.key === ranking) ?? RANKING_OPTIONS[0]

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị · Phân tích"
        title="Phân tích khách hàng"
        description="Theo dõi tăng trưởng tài khoản, chuyển đổi, hành vi trả phí và top 10 customer trong phạm vi đã chọn."
      />

      <AdminAnalyticsFiltersPanel
        filters={filters}
        onChange={setFilters}
        onReset={reset}
      />

      <p className="-mt-3 mb-6 text-xs text-slate-500">
        Đăng ký và funnel tài khoản dùng ngày tạo tài khoản; booking dùng ngày phục vụ; doanh thu và top 10 dùng ngày thanh toán.
      </p>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Tổng customer"
          value={accountMetrics.total_customers.toLocaleString('vi-VN')}
          icon={Users}
          accent="brand"
          hint={`${accountMetrics.active_accounts.toLocaleString('vi-VN')} đang hoạt động`}
        />
        <StatCard
          label="Đăng ký trong kỳ"
          value={accountMetrics.new_customers.toLocaleString('vi-VN')}
          icon={UserPlus}
          accent="violet"
          hint={`${accountMetrics.verification_rate.toFixed(1)}% đã xác minh`}
        />
        <StatCard
          label="Đã phát sinh trả phí"
          value={funnel.activated_customers.toLocaleString('vi-VN')}
          icon={BadgeCheck}
          accent="emerald"
          hint={`${funnel.activation_rate.toFixed(1)}% customer trong cohort`}
        />
        <StatCard
          label="Doanh thu trong kỳ"
          value={formatCurrency(valueMetrics.total_revenue)}
          icon={WalletCards}
          accent="amber"
          hint={`${valueMetrics.total_paid_visits.toLocaleString('vi-VN')} lượt đã thanh toán`}
        />
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Xu hướng đăng ký tài khoản</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Bar
                    dataKey="count"
                    name="Tài khoản mới"
                    fill="#8b5cf6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Funnel customer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: 'Customer trong cohort đăng ký',
                value: funnel.registered_customers,
                rate: 100,
              },
              {
                label: 'Đã có ít nhất một lượt trả phí',
                value: funnel.activated_customers,
                rate: funnel.activation_rate,
              },
              {
                label: 'Đã quay lại từ lần thứ hai',
                value: funnel.repeat_customers,
                rate: funnel.repeat_rate,
              },
              {
                label: 'Chưa có lượt trả phí',
                value: funnel.registered_without_paid_visit,
                rate:
                  funnel.registered_customers > 0
                    ? (funnel.registered_without_paid_visit / funnel.registered_customers) * 100
                    : 0,
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="mb-1.5 flex items-center justify-between gap-4 text-sm">
                  <span className="text-slate-600">{item.label}</span>
                  <span className="font-semibold text-slate-900">
                    {item.value.toLocaleString('vi-VN')} ({item.rate.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-cyan-500"
                    style={{ width: `${Math.min(Math.max(item.rate, 0), 100)}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Trung bình {funnel.average_days_to_first_paid_visit.toFixed(1)} ngày từ lúc đăng ký đến lần trả phí đầu tiên.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mb-6 grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking vãng lai và customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bookingMixData}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {bookingMixData.map((entry, index) => (
                      <Cell
                        key={entry.key}
                        fill={BOOKING_MIX_COLORS[index % BOOKING_MIX_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-amber-50 p-3">
                <p className="text-slate-500">Vãng lai</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {bookingMix.walk_in.share.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Hoàn thành {bookingMix.walk_in.completion_rate.toFixed(1)}%
                </p>
              </div>
              <div className="rounded-xl bg-cyan-50 p-3">
                <p className="text-slate-500">Customer</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {bookingMix.registered_customer.share.toFixed(1)}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Hoàn thành {bookingMix.registered_customer.completion_rate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer đã thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">Customer trả phí duy nhất</span>
              <span className="font-semibold text-slate-900">
                {valueMetrics.unique_paying_customers.toLocaleString('vi-VN')}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">Lượt trả phí / customer</span>
              <span className="font-semibold text-slate-900">
                {valueMetrics.average_paid_visits_per_customer.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-sm text-slate-600">Giá trị trung bình</span>
              <span className="font-semibold text-slate-900">
                {formatCurrency(valueMetrics.average_order_value)}
              </span>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <p className="text-xs uppercase tracking-wide text-emerald-700">
                Doanh thu customer
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">
                {formatCurrency(valueMetrics.registered_revenue)}
              </p>
              <p className="mt-1 text-xs text-emerald-700">
                {valueMetrics.registered_paid_visits.toLocaleString('vi-VN')} lượt
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-4">
              <p className="text-xs uppercase tracking-wide text-amber-700">
                Doanh thu vãng lai
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-800">
                {formatCurrency(valueMetrics.walk_in_revenue)}
              </p>
              <p className="mt-1 text-xs text-amber-700">
                {valueMetrics.walk_in_paid_visits.toLocaleString('vi-VN')} lượt
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mức độ quay lại trong kỳ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityDistribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={88}
                    paddingAngle={4}
                  >
                    {activityDistribution.map((entry, index) => (
                      <Cell
                        key={entry.key}
                        fill={ACTIVITY_COLORS[index % ACTIVITY_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => Number(value).toLocaleString('vi-VN')} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-slate-500">
              Một lần: 1 lượt; quay lại: 2–4 lượt; trung thành: từ 5 lượt trả phí.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-amber-500" />
                Top 10 customer
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">{selectedRanking.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {RANKING_OPTIONS.map((option) => (
                <Button
                  key={option.key}
                  size="sm"
                  variant={ranking === option.key ? 'primary' : 'secondary'}
                  onClick={() => setRanking(option.key)}
                >
                  {option.key === 'by_visits' ? (
                    <Repeat2 className="h-4 w-4" />
                  ) : option.key === 'by_spending' ? (
                    <WalletCards className="h-4 w-4" />
                  ) : option.key === 'by_service_variety' ? (
                    <CalendarDays className="h-4 w-4" />
                  ) : (
                    <BadgeCheck className="h-4 w-4" />
                  )}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          <CustomerRankingTable rows={topCustomers[ranking]} ranking={ranking} />
        </CardContent>
      </Card>
    </div>
  )
}
