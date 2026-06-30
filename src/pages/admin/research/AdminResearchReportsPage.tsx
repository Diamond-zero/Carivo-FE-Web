import { FileSearch, Pencil, Play, RefreshCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { getApiErrorMessage } from '../../../api/client'
import { AdminResearchReportFormModal } from '../../../components/admin/research/AdminResearchReportFormModal'
import { CustomerSearchPanel } from '../../../components/customer/CustomerSearchPanel'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Label } from '../../../components/ui/Label'
import { Modal } from '../../../components/ui/Modal'
import { Select } from '../../../components/ui/Select'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { StatCard } from '../../../components/ui/StatCard'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminResearchReportMutations,
  useAdminResearchReports,
} from '../../../hooks/api/admin/useAdminResearchReports'
import type { AdminResearchReportFormValues } from '../../../lib/validations/adminResearchReport'
import { formatDateTime } from '../../../utils/format'
import type { ApiResearchReport } from '../../../types/api/admin'

const STATUS_LABELS: Record<ApiResearchReport['status'], string> = {
  DRAFT: 'Nháp',
  PROCESSING: 'Đang chạy',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Lỗi',
}

const STATUS_VARIANTS: Record<
  ApiResearchReport['status'],
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  DRAFT: 'default',
  PROCESSING: 'info',
  COMPLETED: 'success',
  FAILED: 'danger',
}

type FormMode = 'create' | 'edit' | null

export function AdminResearchReportsPage() {
  const { showToast } = useToast()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ApiResearchReport['status'] | 'ALL'>('ALL')
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [editingReport, setEditingReport] = useState<ApiResearchReport | null>(null)
  const [deleteReportId, setDeleteReportId] = useState<string | null>(null)

  const { data, isLoading, isError, error } = useAdminResearchReports({
    search: query.trim() || undefined,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  })
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    runMutation,
    retryMutation,
  } = useAdminResearchReportMutations()

  const reports = data?.reports ?? []
  const completedCount = reports.filter((r) => r.status === 'COMPLETED').length
  const processingCount = reports.filter((r) => r.status === 'PROCESSING').length
  const failedCount = reports.filter((r) => r.status === 'FAILED').length

  const openCreate = () => {
    setEditingReport(null)
    setFormMode('create')
  }

  const openEdit = (report: ApiResearchReport) => {
    setEditingReport(report)
    setFormMode('edit')
  }

  const closeForm = () => {
    setFormMode(null)
    setEditingReport(null)
  }

  const handleFormSubmit = async (values: AdminResearchReportFormValues) => {
    const filters = {
      survey_id: values.filters.survey_id,
      from: values.filters.from || null,
      to: values.filters.to || null,
      garage_id: values.filters.garage_id || null,
      service_package_id: values.filters.service_package_id || null,
      vehicle_type: values.filters.vehicle_type ?? null,
      group_by: values.filters.group_by,
    }
    if (formMode === 'create') {
      try {
        await createMutation.mutateAsync({
          title: values.title,
          objective: values.objective,
          type: 'SURVEY_INSIGHT',
          filters,
        })
        showToast(`Đã tạo báo cáo "${values.title}".`, 'success')
        closeForm()
      } catch (mutationError) {
        showToast(getApiErrorMessage(mutationError, 'Không thể tạo báo cáo.'), 'error')
      }
      return
    }
    if (!editingReport) return
    try {
      await updateMutation.mutateAsync({
        reportId: editingReport.id,
        payload: {
          title: values.title,
          objective: values.objective,
          type: 'SURVEY_INSIGHT',
          filters,
        },
      })
      showToast(`Đã cập nhật báo cáo "${values.title}".`, 'success')
      closeForm()
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Không thể cập nhật báo cáo.'), 'error')
    }
  }

  const handleRun = async (report: ApiResearchReport) => {
    try {
      await runMutation.mutateAsync(report.id)
      showToast(`Đã gửi lệnh chạy báo cáo "${report.title}".`, 'success')
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Không thể chạy báo cáo.'), 'error')
    }
  }

  const handleRetry = async (report: ApiResearchReport) => {
    try {
      await retryMutation.mutateAsync(report.id)
      showToast(`Đang thử lại báo cáo "${report.title}".`, 'success')
    } catch (mutationError) {
      showToast(getApiErrorMessage(mutationError, 'Không thể thử lại.'), 'error')
    }
  }

  const handleConfirmDelete = () => {
    if (!deleteReportId) return
    const target = reports.find((r) => r.id === deleteReportId)
    deleteMutation.mutate(deleteReportId, {
      onSuccess: () => {
        setDeleteReportId(null)
        showToast(`Đã xóa báo cáo "${target?.title ?? ''}".`, 'success')
      },
      onError: (mutationError) => {
        showToast(getApiErrorMessage(mutationError, 'Không thể xóa báo cáo.'), 'error')
      },
    })
  }

  if (isLoading) {
    return (
      <div>
        <DashboardPageSkeleton />
      </div>
    )
  }

  if (isError) {
    return (
      <div>
        <PageHeader
          title="Báo cáo nghiên cứu"
          description="Tạo và chạy các báo cáo nghiên cứu AI từ khảo sát khách hàng."
        />
        <EmptyState
          icon={FileSearch}
          title="Không thể tải danh sách báo cáo"
          description={getApiErrorMessage(error, 'Vui lòng thử lại sau.')}
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        eyebrow="Carivo Quản trị"
        title="Báo cáo nghiên cứu"
        description="Tạo, chỉnh sửa, chạy và xóa các báo cáo nghiên cứu AI từ khảo sát khách hàng."
        action={
          <Button onClick={openCreate}>
            <FileSearch className="h-4 w-4" />
            Tạo báo cáo
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tổng báo cáo" value={reports.length} icon={FileSearch} accent="brand" />
        <StatCard label="Hoàn thành" value={completedCount} icon={FileSearch} accent="emerald" />
        <StatCard label="Đang chạy" value={processingCount} icon={FileSearch} accent="amber" />
        <StatCard label="Lỗi" value={failedCount} icon={FileSearch} accent="violet" />
      </div>

      <div className="mb-6 space-y-4">
        <CustomerSearchPanel
          query={query}
          onChange={setQuery}
          onReset={() => setQuery('')}
        />
        <div className="carivo-panel max-w-xs p-4">
          <Label htmlFor="report-status-filter">Trạng thái</Label>
          <Select
            id="report-status-filter"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as ApiResearchReport['status'] | 'ALL')
            }
          >
            <option value="ALL">Tất cả</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{reports.length} báo cáo</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3">Tiêu đề</th>
                <th className="px-6 py-3">Trạng thái</th>
                <th className="px-6 py-3">Cập nhật</th>
                <th className="px-6 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-slate-100/80 hover:bg-slate-50/50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-slate-900">{report.title}</p>
                    {report.objective ? (
                      <p className="mt-0.5 max-w-md truncate text-xs text-slate-500">
                        {report.objective}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={STATUS_VARIANTS[report.status] ?? 'default'}>
                      {STATUS_LABELS[report.status] ?? report.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {report.updated_at ? formatDateTime(report.updated_at) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      {report.status === 'DRAFT' || report.status === 'FAILED' ? (
                        <Button
                          size="sm"
                          onClick={() => void handleRun(report)}
                          disabled={runMutation.isPending}
                        >
                          <Play className="h-4 w-4" />
                          Chạy
                        </Button>
                      ) : null}
                      {report.status === 'FAILED' ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => void handleRetry(report)}
                          disabled={retryMutation.isPending}
                        >
                          <RefreshCcw className="h-4 w-4" />
                          Thử lại
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => openEdit(report)}
                      >
                        <Pencil className="h-4 w-4" />
                        Sửa
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setDeleteReportId(report.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {reports.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-500">
              Chưa có báo cáo nghiên cứu. Bấm "Tạo báo cáo" để bắt đầu.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <AdminResearchReportFormModal
        open={formMode !== null}
        mode={formMode === 'edit' ? 'edit' : 'create'}
        initialReport={editingReport ?? undefined}
        onClose={closeForm}
        onSubmit={handleFormSubmit}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      <Modal
        open={Boolean(deleteReportId)}
        onClose={() => setDeleteReportId(null)}
        title="Xóa báo cáo nghiên cứu?"
        description={
          deleteReportId
            ? reports.find((r) => r.id === deleteReportId)?.title ?? ''
            : undefined
        }
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm text-red-800">
            Thao tác này không thể hoàn tác. Kết quả phân tích sẽ bị xóa theo.
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteReportId(null)}>
              Hủy
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa báo cáo'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}