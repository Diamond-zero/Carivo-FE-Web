import { ArrowRightLeft, Loader2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import { Input } from '../ui/Input'
import { Label } from '../ui/Label'
import { Modal } from '../ui/Modal'
import { Select } from '../ui/Select'
import { useToast } from '../../contexts/ToastContext'
import {
  useCancelMyStaffTypeChangeRequest,
  useCreateStaffTypeChangeRequest,
  useMyStaffTypeChangeRequests,
} from '../../hooks/api/staff/useStaffTypeChangeRequests'
import type { ApiStaffTypeChangeRequest } from '../../api/staffTypeChange.api'
import { formatDateTime } from '../../utils/format'
import { STAFF_TYPE_LABELS, STAFF_TYPES } from '../../constants/staffType'
import type { StaffType } from '../../types/staffProfile'

const REQUEST_STATUS_LABELS: Record<string, string> = {
  REQUESTED: 'Đang chờ duyệt',
  APPROVED: 'Đã duyệt',
  SCHEDULED: 'Đã lên lịch',
  APPLIED: 'Đã áp dụng',
  REJECTED: 'Bị từ chối',
  CANCELLED: 'Đã hủy',
  FAILED: 'Thất bại',
}

const REQUEST_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  REQUESTED: 'warning',
  APPROVED: 'success',
  SCHEDULED: 'info',
  APPLIED: 'success',
  REJECTED: 'danger',
  CANCELLED: 'default',
  FAILED: 'danger',
}

const STAFF_TYPE_OPTIONS = STAFF_TYPES.map((value) => ({
  value,
  label: STAFF_TYPE_LABELS[value],
}))

interface StaffTypeChangeCardProps {
  currentStaffType: StaffType
}

function requestIsOpen(status: string): boolean {
  return status === 'REQUESTED' || status === 'APPROVED' || status === 'SCHEDULED'
}

export function StaffTypeChangeCard({ currentStaffType }: StaffTypeChangeCardProps) {
  const { showToast } = useToast()
  const { data, isLoading, isError, error } = useMyStaffTypeChangeRequests()
  const createMutation = useCreateStaffTypeChangeRequest()
  const cancelMutation = useCancelMyStaffTypeChangeRequest()

  const requests: ApiStaffTypeChangeRequest[] = data ?? []

  const [formOpen, setFormOpen] = useState(false)
  const [targetType, setTargetType] = useState<StaffType>(currentStaffType)
  const [reason, setReason] = useState('')
  const [effectiveAt, setEffectiveAt] = useState('')
  const [handoverNote, setHandoverNote] = useState('')
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null)

  const availableTargetTypes = useMemo(
    () => STAFF_TYPE_OPTIONS.filter((option) => option.value !== currentStaffType),
    [currentStaffType],
  )

  const handleOpenForm = () => {
    setTargetType(availableTargetTypes[0]?.value ?? currentStaffType)
    setReason('')
    setEffectiveAt('')
    setHandoverNote('')
    setFormOpen(true)
  }

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showToast('Vui lòng nhập lý do đổi vị trí.', 'error')
      return
    }
    if (targetType === currentStaffType) {
      showToast('Vị trí mới phải khác vị trí hiện tại.', 'error')
      return
    }
    try {
      await createMutation.mutateAsync({
        to_staff_type: targetType,
        reason: reason.trim(),
        effective_at: effectiveAt || undefined,
        handover_note: handoverNote.trim() || undefined,
      })
      showToast('Đã gửi yêu cầu đổi vị trí — chờ admin duyệt.', 'success')
      setFormOpen(false)
    } catch (mutationError) {
      showToast(
        mutationError instanceof Error
          ? mutationError.message
          : 'Không thể gửi yêu cầu đổi vị trí.',
        'error',
      )
    }
  }

  const handleCancel = async (requestId: string) => {
    try {
      await cancelMutation.mutateAsync({ requestId })
      showToast('Đã hủy yêu cầu đổi vị trí.', 'success')
      setConfirmCancelId(null)
    } catch (mutationError) {
      showToast(
        mutationError instanceof Error
          ? mutationError.message
          : 'Không thể hủy yêu cầu.',
        'error',
      )
    }
  }

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ArrowRightLeft className="h-5 w-5 text-slate-500" />
          Yêu cầu đổi vị trí
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm text-slate-500">Vị trí hiện tại</p>
            <p className="mt-0.5 text-base font-semibold text-slate-900">
              {STAFF_TYPE_LABELS[currentStaffType]}
            </p>
          </div>
          <Button onClick={handleOpenForm} size="sm" disabled={availableTargetTypes.length === 0}>
            Yêu cầu đổi vị trí
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Đang tải danh sách yêu cầu…
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Không tải được danh sách yêu cầu.'}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-slate-500">
            Bạn chưa từng gửi yêu cầu đổi vị trí nào.
          </p>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => {
              const status = request.status
              const statusLabel =
                REQUEST_STATUS_LABELS[status] ?? status
              const fromLabel =
                STAFF_TYPE_LABELS[request.from_staff_type as StaffType] ??
                request.from_staff_type
              const toLabel =
                STAFF_TYPE_LABELS[request.to_staff_type as StaffType] ??
                request.to_staff_type
              return (
                <div
                  key={request.id}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <Badge variant={REQUEST_STATUS_VARIANT[status] ?? 'default'}>
                    {statusLabel}
                  </Badge>
                  <div className="flex-1 min-w-0 text-sm">
                    <p className="font-medium text-slate-900">
                      {fromLabel} → {toLabel}
                    </p>
                    <p className="text-slate-500">{request.reason}</p>
                    {request.effective_at ? (
                      <p className="text-xs text-slate-500">
                        Có hiệu lực: {formatDateTime(request.effective_at)}
                      </p>
                    ) : null}
                  </div>
                  {requestIsOpen(status) ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setConfirmCancelId(request.id)}
                    >
                      <X className="h-4 w-4" />
                      Hủy yêu cầu
                    </Button>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>

      <Modal
        open={formOpen}
        onClose={() => (createMutation.isPending ? null : setFormOpen(false))}
        title="Yêu cầu đổi vị trí"
        description="Admin sẽ xem xét yêu cầu của bạn. Sau khi được duyệt, vị trí sẽ được cập nhật trong hồ sơ nhân viên."
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="to-staff-type" required>
              Vị trí muốn chuyển đến
            </Label>
            <Select
              id="to-staff-type"
              value={targetType}
              onChange={(event) => setTargetType(event.target.value as StaffType)}
            >
              {availableTargetTypes.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="reason" required>
              Lý do đổi
            </Label>
            <textarea
              id="reason"
              rows={3}
              className="min-h-[80px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              placeholder="Mô tả lý do bạn muốn đổi vị trí…"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="effective-at">Ngày có hiệu lực (tùy chọn)</Label>
            <Input
              id="effective-at"
              type="datetime-local"
              value={effectiveAt}
              onChange={(event) => setEffectiveAt(event.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="handover-note">Ghi chú bàn giao (tùy chọn)</Label>
            <textarea
              id="handover-note"
              rows={2}
              className="min-h-[60px] w-full rounded-xl border border-slate-200/90 bg-white px-4 py-2.5 text-sm shadow-[var(--shadow-carivo-sm)] outline-none transition-all focus:border-brand-400 focus:ring-2 focus:ring-brand-500/15"
              placeholder="Ghi chú thêm cho admin…"
              value={handoverNote}
              onChange={(event) => setHandoverNote(event.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setFormOpen(false)}
              disabled={createMutation.isPending}
            >
              Hủy
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              Gửi yêu cầu
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(confirmCancelId)}
        onClose={() => (cancelMutation.isPending ? null : setConfirmCancelId(null))}
        title="Hủy yêu cầu đổi vị trí?"
        description="Hành động này không thể hoàn tác."
      >
        <div className="flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => setConfirmCancelId(null)}
            disabled={cancelMutation.isPending}
          >
            Đóng
          </Button>
          <Button
            variant="danger"
            onClick={() => confirmCancelId && void handleCancel(confirmCancelId)}
            disabled={cancelMutation.isPending}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Xác nhận hủy
          </Button>
        </div>
      </Modal>
    </Card>
  )
}