import { AlertTriangle, Clock, Loader2, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../api/client'
import { PageHeader } from '../../components/layout/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { Label } from '../../components/ui/Label'
import { Select } from '../../components/ui/Select'
import { DashboardPageSkeleton } from '../../components/ui/Skeleton'
import { StatCard } from '../../components/ui/StatCard'
import { useToast } from '../../contexts/ToastContext'
import {
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
  useStaffCustomerCaseSlaDashboard,
  useStaffCustomerCases,
} from '../../hooks/api/staff/useStaffCustomerCases'
import type { ApiCustomerCase } from '../../types/api/customerCase'
import { formatDateTime } from '../../utils/format'

const PAGE_SIZE = 20

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  ...Object.entries(CASE_STATUS_LABELS).map(([value, label]) => ({ value, label })),
]

const PRIORITY_OPTIONS = [
  { value: 'ALL', label: 'Tất cả mức độ' },
  ...Object.entries(CASE_PRIORITY_LABELS).map(([value, label]) => ({ value, label })),
]

export function StaffCustomerCasesPage() {
  const { showToast } = useToast()
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [page, setPage] = useState(1)

  const params = useMemo(
    () => ({
      page,
      limit: PAGE_SIZE,
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
    }),
    [page, statusFilter, priorityFilter],
  )

  const casesQuery = useStaffCustomerCases(params)
  const slaQuery = useStaffCustomerCaseSlaDashboard()

  const cases: ApiCustomerCase[] = casesQuery.data?.data ?? []
  const meta = casesQuery.data?.meta
  const totalPages = meta?.total_pages ?? 1
  const total = meta?.total ?? cases.length
  const sla = slaQuery.data

  useEffect(() => {
    if (casesQuery.isError) {
      showToast(
        getApiErrorMessage(casesQuery.error, 'Không tải được danh sách hồ sơ.'),
        'error',
      )
    }
  }, [casesQuery.isError, casesQuery.error, showToast])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, priorityFilter])

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Staff"
        title="Hồ sơ khiếu nại"
        description="Danh sách hồ sơ khiếu nại của khách hàng tại chi nhánh của bạn. Nhấn vào hồ sơ để xem chi tiết timeline và xử lý."
        action={
          <div className="flex flex-wrap gap-2">
            <Link to="/staff/cases/sla">
              <Button variant="secondary" size="sm">
                <ShieldCheck className="h-4 w-4" />
                SLA dashboard
              </Button>
            </Link>
            <Link to="/staff/cases/walk-in">
              <Button size="sm">
                <AlertTriangle className="h-4 w-4" />
                Tạo case walk-in
              </Button>
            </Link>
          </div>
        }
      />

      {sla ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Tổng case đang mở"
            value={sla.total_open}
            icon={Clock}
            accent="brand"
          />
          <StatCard
            label="Đúng hạn"
            value={sla.on_track}
            icon={ShieldCheck}
            accent="green"
          />
          <StatCard
            label="Sắp trễ hạn"
            value={sla.at_risk}
            icon={Clock}
            accent="amber"
          />
          <StatCard
            label="Đã trễ hạn"
            value={sla.breached}
            icon={AlertTriangle}
            accent="red"
          />
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="carivo-panel p-4">
          <Label htmlFor="case-status">Trạng thái</Label>
          <Select
            id="case-status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="carivo-panel p-4">
          <Label htmlFor="case-priority">Mức độ ưu tiên</Label>
          <Select
            id="case-priority"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            {PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {casesQuery.isLoading ? (
        <DashboardPageSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {total} hồ sơ
              {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {cases.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Chưa có hồ sơ nào"
                description="Hồ sơ khiếu nại sẽ xuất hiện ở đây khi khách hàng gửi phản ánh hoặc khi staff tạo case walk-in."
              />
            ) : (
              <table className="w-full min-w-[920px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Mã</th>
                    <th className="px-6 py-3">Khách hàng</th>
                    <th className="px-6 py-3">Chủ đề</th>
                    <th className="px-6 py-3">Ưu tiên</th>
                    <th className="px-6 py-3">Trạng thái</th>
                    <th className="px-6 py-3">SLA</th>
                    <th className="px-6 py-3 text-right">Mở</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono text-slate-900">
                        {c.case_code ?? c.id.replace('case-', '#')}
                      </td>
                      <td className="px-6 py-4 text-slate-700">
                        {c.customer?.full_name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">{c.subject}</p>
                        <p className="text-xs text-slate-500">{c.category}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={CASE_PRIORITY_VARIANT[c.priority] ?? 'default'}>
                          {CASE_PRIORITY_LABELS[c.priority] ?? c.priority}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={CASE_STATUS_VARIANT[c.status] ?? 'default'}>
                          {CASE_STATUS_LABELS[c.status] ?? c.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        {c.sla_due_at ? formatDateTime(c.sla_due_at) : '—'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/staff/cases/${c.id}`}>
                          <Button size="sm" variant="secondary">
                            Mở
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}

      {totalPages > 1 ? (
        <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1}
          >
            Trang trước
          </Button>
          <span>
            Trang {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page >= totalPages}
          >
            Trang sau
          </Button>
        </div>
      ) : null}

      {casesQuery.isFetching ? (
        <div className="mt-2 flex items-center justify-center text-xs text-slate-500">
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Đang đồng bộ…
        </div>
      ) : null}
    </div>
  )
}