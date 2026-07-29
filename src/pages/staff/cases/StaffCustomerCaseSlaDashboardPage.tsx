import { AlertTriangle, ArrowLeft, Clock, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import {
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  useStaffCustomerCaseSlaDashboard,
} from '../../../hooks/api/staff/useStaffCustomerCases'
import type { CustomerCaseSlaState } from '../../../types/api/customerCase'
import { formatDateTime } from '../../../utils/format'

const SLA_STATE_LABELS: Record<CustomerCaseSlaState, string> = {
  ON_TRACK: 'Đúng hạn',
  FIRST_RESPONSE_OVERDUE: 'Quá hạn phản hồi đầu',
  RESOLUTION_OVERDUE: 'Quá hạn giải quyết',
  BREACHED: 'Vi phạm SLA',
}

const SLA_STATE_VARIANTS: Record<
  CustomerCaseSlaState,
  'success' | 'warning' | 'danger'
> = {
  ON_TRACK: 'success',
  FIRST_RESPONSE_OVERDUE: 'warning',
  RESOLUTION_OVERDUE: 'warning',
  BREACHED: 'danger',
}

export function StaffCustomerCaseSlaDashboardPage() {
  const { data, isLoading, isError, error } = useStaffCustomerCaseSlaDashboard()

  if (isLoading) return <DashboardPageSkeleton />

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error instanceof Error
          ? error.message
          : 'Không tải được SLA dashboard.'}
      </div>
    )
  }

  if (!data) return null

  const { summary, cases } = data
  const overdue =
    (summary.by_sla_state.FIRST_RESPONSE_OVERDUE ?? 0) +
    (summary.by_sla_state.RESOLUTION_OVERDUE ?? 0)

  return (
    <div>
      <div className="mb-4">
        <Link
          to="/staff/cases"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại danh sách
        </Link>
      </div>

      <PageHeader
        eyebrow="Carivo Staff"
        title="SLA Dashboard"
        description="Tổng quan hồ sơ khiếu nại tại chi nhánh theo mức độ ưu tiên, trạng thái và hạn xử lý."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng hồ sơ"
          value={summary.total}
          icon={Clock}
          accent="brand"
        />
        <StatCard
          label="Đúng hạn"
          value={summary.by_sla_state.ON_TRACK ?? 0}
          icon={ShieldCheck}
          accent="emerald"
        />
        <StatCard
          label="Quá hạn xử lý"
          value={overdue}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Vi phạm SLA"
          value={summary.by_sla_state.BREACHED ?? 0}
          icon={AlertTriangle}
          accent="red"
        />
      </div>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Phân theo mức độ ưu tiên
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(summary.by_priority).length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
            ) : (
              Object.entries(summary.by_priority).map(([priority, count]) => (
                <div
                  key={priority}
                  className="flex items-center justify-between"
                >
                  <Badge variant={CASE_PRIORITY_VARIANT[priority] ?? 'default'}>
                    {CASE_PRIORITY_LABELS[priority] ?? priority}
                  </Badge>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân theo trạng thái</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(summary.by_status).length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
            ) : (
              Object.entries(summary.by_status).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <Badge variant={CASE_STATUS_VARIANT[status] ?? 'default'}>
                    {CASE_STATUS_LABELS[status] ?? status}
                  </Badge>
                  <span className="font-semibold text-slate-900">{count}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chi tiết SLA</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          {cases.length === 0 ? (
            <p className="px-6 py-8 text-sm text-slate-500">Chưa có hồ sơ.</p>
          ) : (
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-6 py-3">Mã</th>
                  <th className="px-6 py-3">Ưu tiên</th>
                  <th className="px-6 py-3">Trạng thái</th>
                  <th className="px-6 py-3">SLA</th>
                  <th className="px-6 py-3">Hạn giải quyết</th>
                  <th className="px-6 py-3 text-right">Mở</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cases.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 font-mono text-slate-900">
                      {item.case_code}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          CASE_PRIORITY_VARIANT[item.priority] ?? 'default'
                        }
                      >
                        {CASE_PRIORITY_LABELS[item.priority] ?? item.priority}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={CASE_STATUS_VARIANT[item.status] ?? 'default'}
                      >
                        {CASE_STATUS_LABELS[item.status] ?? item.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={SLA_STATE_VARIANTS[item.sla_state]}>
                        {SLA_STATE_LABELS[item.sla_state]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.resolution_due_at
                        ? formatDateTime(item.resolution_due_at)
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/staff/cases/${item.id}`}
                        className="font-medium text-brand-700 hover:text-brand-800"
                      >
                        Xem hồ sơ
                      </Link>
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
