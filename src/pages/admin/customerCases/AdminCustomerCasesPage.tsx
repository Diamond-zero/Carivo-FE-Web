import {
  AlertTriangle,
  Clock,
  FolderKanban,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Input } from '../../../components/ui/Input'
import { Label } from '../../../components/ui/Label'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import {
  CASE_CATEGORY_LABELS,
  CASE_CATEGORY_OPTIONS,
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
} from '../../../constants/customerCase'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminCustomerCases,
  useAdminCustomerCaseSlaDashboard,
} from '../../../hooks/api/admin/useAdminCustomerCases'
import { useAdminGarages } from '../../../hooks/api/admin/useAdminGarages'
import type {
  ApiCustomerCaseListParams,
  CustomerCaseCategory,
  CustomerCasePriority,
  CustomerCaseStatus,
} from '../../../types/api/customerCase'
import { formatDateTime } from '../../../utils/format'

const PAGE_SIZE = 20

export function AdminCustomerCasesPage() {
  const { showToast } = useToast()
  const [garageId, setGarageId] = useState('ALL')
  const [status, setStatus] = useState<CustomerCaseStatus | 'ALL'>('ALL')
  const [priority, setPriority] = useState<CustomerCasePriority | 'ALL'>('ALL')
  const [category, setCategory] = useState<CustomerCaseCategory | 'ALL'>('ALL')
  const [caseCodeInput, setCaseCodeInput] = useState('')
  const [caseCode, setCaseCode] = useState('')
  const [page, setPage] = useState(1)

  const { allGarages: garages, isLoading: isLoadingGarages } =
    useAdminGarages()
  const garageNames = useMemo(
    () => new Map(garages.map((garage) => [garage.id, garage.name])),
    [garages],
  )
  const params = useMemo<ApiCustomerCaseListParams>(
    () => ({
      page,
      limit: PAGE_SIZE,
      ...(garageId === 'ALL' ? {} : { garage_id: garageId }),
      ...(status === 'ALL' ? {} : { status }),
      ...(priority === 'ALL' ? {} : { priority }),
      ...(category === 'ALL' ? {} : { category }),
      ...(caseCode ? { case_code: caseCode } : {}),
    }),
    [page, garageId, status, priority, category, caseCode],
  )
  const casesQuery = useAdminCustomerCases(params)
  const slaQuery = useAdminCustomerCaseSlaDashboard(
    garageId === 'ALL' ? undefined : garageId,
  )
  const cases = casesQuery.data?.data ?? []
  const meta = casesQuery.data?.meta
  const totalPages = meta?.total_pages ?? 1
  const summary = slaQuery.data?.summary
  const overdue =
    (summary?.by_sla_state.FIRST_RESPONSE_OVERDUE ?? 0) +
    (summary?.by_sla_state.RESOLUTION_OVERDUE ?? 0)

  useEffect(() => {
    if (!casesQuery.isError) return
    showToast(
      getApiErrorMessage(
        casesQuery.error,
        'Không thể tải danh sách hồ sơ khiếu nại.',
      ),
      'error',
    )
  }, [casesQuery.error, casesQuery.isError, showToast])

  const resetPage = () => setPage(1)

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Hồ sơ khiếu nại"
        description="Theo dõi và hoàn tất toàn bộ vòng đời khiếu nại trên các garage."
      />

      {summary ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Tổng hồ sơ"
            value={summary.total}
            icon={FolderKanban}
            accent="brand"
          />
          <StatCard
            label="Đúng hạn"
            value={summary.by_sla_state.ON_TRACK ?? 0}
            icon={ShieldCheck}
            accent="emerald"
          />
          <StatCard
            label="Quá hạn"
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
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bộ lọc hồ sơ</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <Label htmlFor="admin-case-garage">Garage</Label>
            <Select
              id="admin-case-garage"
              value={garageId}
              disabled={isLoadingGarages}
              onChange={(event) => {
                setGarageId(event.target.value)
                resetPage()
              }}
            >
              <option value="ALL">Tất cả garage</option>
              {garages.map((garage) => (
                <option key={garage.id} value={garage.id}>
                  {garage.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="admin-case-status">Trạng thái</Label>
            <Select
              id="admin-case-status"
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as CustomerCaseStatus | 'ALL')
                resetPage()
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              {Object.entries(CASE_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="admin-case-priority">Mức độ</Label>
            <Select
              id="admin-case-priority"
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value as CustomerCasePriority | 'ALL')
                resetPage()
              }}
            >
              <option value="ALL">Tất cả mức độ</option>
              {Object.entries(CASE_PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="admin-case-category">Phân loại</Label>
            <Select
              id="admin-case-category"
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as CustomerCaseCategory | 'ALL')
                resetPage()
              }}
            >
              <option value="ALL">Tất cả phân loại</option>
              {CASE_CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              setCaseCode(caseCodeInput.trim().toUpperCase())
              resetPage()
            }}
          >
            <Label htmlFor="admin-case-code">Mã hồ sơ chính xác</Label>
            <div className="flex gap-2">
              <Input
                id="admin-case-code"
                value={caseCodeInput}
                placeholder="CC-YYYYMMDD-XXXXXXXX"
                onChange={(event) => setCaseCodeInput(event.target.value)}
              />
              <Button type="submit" variant="secondary">
                Lọc
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {casesQuery.isLoading ? (
        <DashboardPageSkeleton />
      ) : casesQuery.isError ? (
        <EmptyState
          icon={AlertTriangle}
          title="Không thể tải hồ sơ"
          description={getApiErrorMessage(
            casesQuery.error,
            'Vui lòng thử lại sau.',
          )}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {meta?.total ?? cases.length} hồ sơ
              {meta ? ` · Trang ${meta.page}/${meta.total_pages}` : ''}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto p-0">
            {cases.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="Không có hồ sơ phù hợp"
                description="Hãy thay đổi bộ lọc hoặc kiểm tra lại mã hồ sơ."
              />
            ) : (
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Mã</th>
                    <th className="px-5 py-3">Garage</th>
                    <th className="px-5 py-3">Khách hàng</th>
                    <th className="px-5 py-3">Phân loại</th>
                    <th className="px-5 py-3">Ưu tiên</th>
                    <th className="px-5 py-3">Trạng thái</th>
                    <th className="px-5 py-3">Phụ trách</th>
                    <th className="px-5 py-3">Hạn xử lý</th>
                    <th className="px-5 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cases.map((customerCase) => (
                    <tr
                      key={customerCase.id}
                      className="hover:bg-slate-50/60"
                    >
                      <td className="px-5 py-4 font-mono font-medium text-slate-900">
                        {customerCase.case_code ?? customerCase.id}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {garageNames.get(customerCase.garage_id ?? '') ??
                          customerCase.garage_id ??
                          '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <p>
                          {customerCase.customer?.full_name ??
                            customerCase.reporter_name ??
                            '—'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {customerCase.customer?.phone ??
                            customerCase.reporter_phone ??
                            ''}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {CASE_CATEGORY_LABELS[customerCase.category]}
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={
                            CASE_PRIORITY_VARIANT[customerCase.priority]
                          }
                        >
                          {CASE_PRIORITY_LABELS[customerCase.priority]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <Badge
                          variant={CASE_STATUS_VARIANT[customerCase.status]}
                        >
                          {CASE_STATUS_LABELS[customerCase.status]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        {customerCase.assigned_to?.full_name ??
                          'Chưa phân công'}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600">
                        {customerCase.resolution_due_at
                          ? formatDateTime(customerCase.resolution_due_at)
                          : '—'}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to={`/admin/customer-cases/${customerCase.id}`}
                        >
                          <Button size="sm" variant="secondary">
                            Mở hồ sơ
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
        <div className="mt-6 flex items-center justify-between">
          <Button
            size="sm"
            variant="secondary"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Trang trước
          </Button>
          <span className="text-sm text-slate-600">
            Trang {page} / {totalPages}
          </span>
          <Button
            size="sm"
            variant="secondary"
            disabled={page >= totalPages}
            onClick={() =>
              setPage((current) => Math.min(totalPages, current + 1))
            }
          >
            Trang sau
          </Button>
        </div>
      ) : null}

      {casesQuery.isFetching && !casesQuery.isLoading ? (
        <div className="mt-3 flex items-center justify-center text-xs text-slate-500">
          <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
          Đang đồng bộ dữ liệu
        </div>
      ) : null}
    </div>
  )
}
