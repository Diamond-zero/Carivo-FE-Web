import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  History,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getApiErrorMessage } from '../../../api/client'
import {
  getStaffTypeChangeImpactApi,
  type ApiStaffTypeChangeRequest,
} from '../../../api/staffTypeChange.api'
import {
  AdminStaffTypeChangeDecisionModal,
  type StaffTypeChangeDecisionMode,
} from '../../../components/admin/staffTypeChange/AdminStaffTypeChangeDecisionModal'
import { ImpactPreviewBlock } from '../../../components/admin/staffTypeChange/ImpactPreviewBlock'
import { StaffTypeChangeTimeline } from '../../../components/admin/staffTypeChange/StaffTypeChangeTimeline'
import { StaffTypeChangeImpactPreviewModal } from '../../../components/admin/staffTypeChange/StaffTypeChangeImpactPreviewModal'
import { PageHeader } from '../../../components/layout/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { DashboardPageSkeleton } from '../../../components/ui/Skeleton'
import { useToast } from '../../../contexts/ToastContext'
import {
  useAdminStaffTypeChangeHistory,
  useAdminStaffTypeChangeImpact,
  useAdminStaffTypeChangeRequests,
  useCancelAdminStaffTypeChangeRequest,
} from '../../../hooks/api/admin/useAdminStaffTypeChangeRequests'
import { STAFF_TYPE_LABELS } from '../../../constants/staffType'
import {
  STAFF_TYPE_CHANGE_STATUS_COLORS,
  STAFF_TYPE_CHANGE_STATUS_LABELS,
  STAFF_TYPE_TRANSITION_HINTS,
} from '../../../constants/staffTypeChange'
import { cn } from '../../../lib/utils'

function formatDateTime(value?: string | null) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

export function AdminStaffTypeChangeRequestDetailPage() {
  const { requestId } = useParams<{ requestId: string }>()
  const { showToast } = useToast()
  const [decisionMode, setDecisionMode] =
    useState<StaffTypeChangeDecisionMode | null>(null)
  const [impactOpen, setImpactOpen] = useState(false)

  const listQuery = useAdminStaffTypeChangeRequests({})
  const request = useMemo<ApiStaffTypeChangeRequest | null>(() => {
    if (!requestId) return null
    const list: ApiStaffTypeChangeRequest[] = listQuery.data?.data ?? []
    return list.find((r: ApiStaffTypeChangeRequest) => r.id === requestId) ?? null
  }, [listQuery.data, requestId])

  const impactQuery = useAdminStaffTypeChangeImpact(
    request?.staff_profile_id,
    request
      ? {
          to_staff_type: request.to_staff_type as Parameters<
            typeof getStaffTypeChangeImpactApi
          >[1]['to_staff_type'],
        }
      : undefined,
  )
  const historyQuery = useAdminStaffTypeChangeHistory(request?.staff_profile_id)
  const cancelMutation = useCancelAdminStaffTypeChangeRequest()

  useEffect(() => {
    if (listQuery.isError) {
      showToast(
        getApiErrorMessage(listQuery.error, 'Không tải được chi tiết yêu cầu.'),
        'error',
      )
    }
  }, [listQuery.isError, listQuery.error, showToast])

  if (!requestId) {
    return (
      <div>
        <PageHeader title="Không tìm thấy yêu cầu" />
        <EmptyState
          icon={ShieldAlert}
          title="Thiếu mã yêu cầu"
          description="Vui lòng mở lại danh sách và chọn một yêu cầu hợp lệ."
          action={
            <Link to="/admin/staff-type-change-requests">
              <Button>Về danh sách</Button>
            </Link>
          }
        />
      </div>
    )
  }

  if (listQuery.isLoading) {
    return (
      <div>
        <PageHeader title="Đang tải..." />
        <DashboardPageSkeleton />
      </div>
    )
  }

  if (!request) {
    return (
      <div>
        <PageHeader
          title="Yêu cầu không tồn tại"
          description="Có thể yêu cầu đã bị hủy hoặc bạn không có quyền xem."
          action={
            <Link to="/admin/staff-type-change-requests">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
          }
        />
        <EmptyState
          icon={ShieldAlert}
          title="Không tìm thấy yêu cầu"
          description="Vui lòng kiểm tra lại hoặc quay về danh sách."
        />
      </div>
    )
  }

  const fromLabel =
    STAFF_TYPE_LABELS[
      request.from_staff_type as keyof typeof STAFF_TYPE_LABELS
    ] ?? request.from_staff_type
  const toLabel =
    STAFF_TYPE_LABELS[
      request.to_staff_type as keyof typeof STAFF_TYPE_LABELS
    ] ?? request.to_staff_type
  const toHint =
    STAFF_TYPE_TRANSITION_HINTS[
      request.to_staff_type as keyof typeof STAFF_TYPE_TRANSITION_HINTS
    ]

  const canApprove = request.status === 'REQUESTED'
  const canCancel = ['REQUESTED', 'APPROVED', 'SCHEDULED'].includes(
    request.status,
  )

  const handleCancel = async () => {
    if (
      !window.confirm(
        'Bạn có chắc muốn hủy yêu cầu đổi chức năng này? Trạng thái sẽ chuyển sang CANCELLED.',
      )
    ) {
      return
    }
    try {
      await cancelMutation.mutateAsync({ requestId: request.id })
      showToast('Đã hủy yêu cầu đổi chức năng.', 'success')
    } catch (err) {
      showToast(getApiErrorMessage(err, 'Không thể hủy yêu cầu.'), 'error')
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Yêu cầu đổi chức năng"
        title={`${fromLabel} → ${toLabel}`}
        description={`Mã NV: ${request.staff_profile_id.slice(0, 10)} · Trạng thái: ${STAFF_TYPE_CHANGE_STATUS_LABELS[request.status] ?? request.status}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/admin/staff-type-change-requests">
              <Button variant="secondary">
                <ArrowLeft className="h-4 w-4" />
                Quay lại
              </Button>
            </Link>
            <Button variant="secondary" onClick={() => setImpactOpen(true)}>
              <ShieldCheck className="h-4 w-4" />
              Xem ảnh hưởng
            </Button>
            {canApprove ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setDecisionMode('reject')}
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                  Từ chối
                </Button>
                <Button onClick={() => setDecisionMode('apply-now')}>
                  <CheckCircle2 className="h-4 w-4" />
                  Duyệt & áp dụng
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDecisionMode('schedule')}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Lên lịch
                </Button>
              </>
            ) : null}
            {canCancel && !canApprove ? (
              <Button
                variant="danger"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                Hủy yêu cầu
              </Button>
            ) : null}
          </div>
        }
      />

      {/* Banner thất bại nổi bật */}
      {request.status === 'FAILED' && request.failure_reason ? (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <ShieldAlert className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-semibold">Yêu cầu áp dụng thất bại</p>
            <p className="mt-0.5">{request.failure_reason}</p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Chi tiết yêu cầu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                  STAFF_TYPE_CHANGE_STATUS_COLORS[request.status] ??
                    'bg-slate-100 text-slate-700 ring-slate-200',
                )}
              >
                {STAFF_TYPE_CHANGE_STATUS_LABELS[request.status] ?? request.status}
              </span>
              {request.request_source ? (
                <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                  Nguồn:{' '}
                  {request.request_source === 'ADMIN_DIRECTED'
                    ? 'Admin điều chuyển'
                    : 'Nhân viên đề nghị'}
                </span>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Vai trò hiện tại
                </p>
                <p className="mt-1 text-base font-medium text-slate-900">
                  {fromLabel}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Vai trò mong muốn
                </p>
                <p className="mt-1 text-base font-medium text-slate-900">
                  {toLabel}
                </p>
                {toHint ? (
                  <p className="mt-1 text-xs text-slate-500">{toHint}</p>
                ) : null}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Thời điểm áp dụng dự kiến
                </p>
                <p className="mt-1 text-base text-slate-900">
                  {formatDateTime(request.effective_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Thời điểm duyệt
                </p>
                <p className="mt-1 text-base text-slate-900">
                  {formatDateTime(request.approved_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Thời điểm áp dụng thực tế
                </p>
                <p className="mt-1 text-base text-slate-900">
                  {formatDateTime(request.applied_at)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Mã yêu cầu
                </p>
                <p className="mt-1 font-mono text-xs text-slate-700">
                  {request.id}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Lý do nhân viên gửi
              </p>
              <p className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                {request.reason}
              </p>
            </div>

            {request.handover_note ? (
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Ghi chú bàn giao
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                  {request.handover_note}
                </p>
              </div>
            ) : null}

            {request.emergency_override && request.override_reason ? (
              <div>
                <p className="text-xs font-semibold uppercase text-red-700">
                  Emergency override
                </p>
                <p className="mt-1 whitespace-pre-wrap rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {request.override_reason}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              <span className="inline-flex items-center gap-2">
                <History className="h-4 w-4" />
                Timeline & lịch sử
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 text-sm">
            <StaffTypeChangeTimeline request={request} />

            {historyQuery.isLoading ? (
              <p className="text-sm text-slate-500">Đang tải lịch sử...</p>
            ) : historyQuery.isError ? (
              <p className="text-sm text-red-600">
                {getApiErrorMessage(historyQuery.error, 'Không tải được lịch sử.')}
              </p>
            ) : historyQuery.data && historyQuery.data.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Các lần đổi trước
                </p>
                <ul className="mt-2 space-y-2">
                  {historyQuery.data.map((entry) => (
                    <li
                      key={entry.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <p className="text-xs text-slate-500">
                        {formatDateTime(entry.applied_at)}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-800">
                        <strong>
                          {STAFF_TYPE_LABELS[
                            entry.from_staff_type as keyof typeof STAFF_TYPE_LABELS
                          ] ?? entry.from_staff_type}
                        </strong>
                        {' → '}
                        <strong>
                          {STAFF_TYPE_LABELS[
                            entry.to_staff_type as keyof typeof STAFF_TYPE_LABELS
                          ] ?? entry.to_staff_type}
                        </strong>
                      </p>
                      {entry.note ? (
                        <p className="mt-1 text-xs text-slate-600">{entry.note}</p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Card impact snapshot */}
      {request.impact_snapshot ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Ảnh hưởng đã snapshot
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ImpactPreviewBlock
              impact={request.impact_snapshot}
              fromStaffType={request.from_staff_type}
              toStaffType={request.to_staff_type}
            />
          </CardContent>
        </Card>
      ) : null}

      <AdminStaffTypeChangeDecisionModal
        mode={decisionMode}
        request={decisionMode ? request : null}
        onClose={() => setDecisionMode(null)}
        onCompleted={() => {
          setDecisionMode(null)
          void listQuery.refetch()
        }}
      />

      <StaffTypeChangeImpactPreviewModal
        open={impactOpen}
        onClose={() => setImpactOpen(false)}
        impact={impactQuery.data ?? null}
        isLoading={impactQuery.isLoading}
        error={impactQuery.error}
      />

      {/* Nút phụ: refresh nhanh */}
      <div className="mt-6 flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => void listQuery.refetch()}
          disabled={listQuery.isFetching}
        >
          <RefreshCw
            className={
              listQuery.isFetching ? 'h-4 w-4 animate-spin' : 'h-4 w-4'
            }
          />
          Tải lại
        </Button>
      </div>
    </div>
  )
}
