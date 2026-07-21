import { ArrowLeft, AlertTriangle, Clock, Loader2, ShieldCheck } from 'lucide-react'
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
import { formatDateTime } from '../../../utils/format'

export function StaffCustomerCaseSlaDashboardPage() {
  const { data, isLoading, isError, error } = useStaffCustomerCaseSlaDashboard()

  if (isLoading) return <DashboardPageSkeleton />

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error instanceof Error ? error.message : 'Không tải được SLA dashboard.'}
      </div>
    )
  }

  if (!data) return null

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
        description="Tổng quan các hồ sơ khiếu nại tại chi nhánh, phân theo mức độ ưu tiên và tình trạng xử lý."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng case đang mở"
          value={data.total_open}
          icon={Clock}
          accent="brand"
        />
        <StatCard
          label="Đúng hạn"
          value={data.on_track}
          icon={ShieldCheck}
          accent="green"
        />
        <StatCard
          label="Sắp trễ hạn"
          value={data.at_risk}
          icon={Clock}
          accent="amber"
        />
        <StatCard
          label="Đã trễ hạn"
          value={data.breached}
          icon={AlertTriangle}
          accent="red"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Phân theo mức độ ưu tiên</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.keys(data.by_priority).length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
            ) : (
              Object.entries(data.by_priority).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
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
            {Object.keys(data.by_status).length === 0 ? (
              <p className="text-sm text-slate-500">Chưa có dữ liệu.</p>
            ) : (
              Object.entries(data.by_status).map(([status, count]) => (
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

        {data.oldest_unresolved ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Case lâu chưa giải quyết nhất</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={CASE_STATUS_VARIANT[data.oldest_unresolved.status] ?? 'default'}>
                  {CASE_STATUS_LABELS[data.oldest_unresolved.status] ??
                    data.oldest_unresolved.status}
                </Badge>
                <Badge variant={CASE_PRIORITY_VARIANT[data.oldest_unresolved.priority] ?? 'default'}>
                  {CASE_PRIORITY_LABELS[data.oldest_unresolved.priority] ??
                    data.oldest_unresolved.priority}
                </Badge>
                <span className="text-sm text-slate-500">
                  Mở lúc {data.oldest_unresolved.opened_at ? formatDateTime(data.oldest_unresolved.opened_at) : '—'}
                </span>
              </div>
              <p className="font-medium text-slate-900">{data.oldest_unresolved.subject}</p>
              <p className="text-sm text-slate-600">
                {data.oldest_unresolved.customer?.full_name ?? '—'} ·{' '}
                {data.oldest_unresolved.customer?.phone ?? '—'}
              </p>
              <Link to={`/staff/cases/${data.oldest_unresolved.id}`}>
                <Badge variant="info">Mở case</Badge>
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>

      {data ? <Loader2 className="hidden" /> : null}
    </div>
  )
}