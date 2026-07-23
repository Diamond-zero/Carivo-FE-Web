import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { getApiErrorMessage } from '../../../api/client'
import {
  approveStaffTypeChangeRequestApi,
  cancelStaffTypeChangeRequestApi,
  rejectStaffTypeChangeRequestApi,
  type ApiStaffTypeChangeRequest,
  type ApproveStaffTypeChangePayload,
} from '../../../api/staffTypeChange.api'
import { ImpactPreviewBlock } from './ImpactPreviewBlock'
import { STAFF_TYPE_LABELS } from '../../../constants/staffType'
import { STAFF_TYPE_CHANGE_STATUS_LABELS } from '../../../constants/staffTypeChange'
import { useToast } from '../../../contexts/ToastContext'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Textarea } from '../../ui/Textarea'

export type StaffTypeChangeDecisionMode =
  | 'apply-now'
  | 'schedule'
  | 'reject'
  | 'cancel'

const baseEffectiveAtSchema = z
  .object({
    effective_at: z
      .string()
      .optional()
      .refine(
        (val) => !val || !Number.isNaN(new Date(val).getTime()),
        'Thời điểm áp dụng không hợp lệ',
      ),
    handover_note: z.string().max(2000).optional(),
    emergency_override: z.boolean().default(false),
    override_reason: z.string().max(1000).optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (data.emergency_override) {
      if (!data.override_reason || data.override_reason.trim().length < 5) {
        ctx.addIssue({
          code: 'custom',
          path: ['override_reason'],
          message:
            'Vui lòng nhập lý do emergency override (tối thiểu 5 ký tự).',
        })
      }
    }
  })

const rejectSchema = z.object({
  reason: z
    .string()
    .min(5, 'Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự).')
    .max(1000),
})

const cancelSchema = z.object({
  reason: z
    .string()
    .min(5, 'Vui lòng nhập lý do hủy (tối thiểu 5 ký tự).')
    .max(1000),
})

type ApproveFormValues = z.infer<typeof baseEffectiveAtSchema>
type RejectFormValues = z.infer<typeof rejectSchema>
type CancelFormValues = z.infer<typeof cancelSchema>

interface AdminStaffTypeChangeDecisionModalProps {
  mode: StaffTypeChangeDecisionMode | null
  request: ApiStaffTypeChangeRequest | null
  onClose: () => void
  onCompleted?: () => void
}

function toDateTimeLocalInputValue(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const MODE_TITLES: Record<StaffTypeChangeDecisionMode, string> = {
  'apply-now': 'Duyệt & áp dụng ngay',
  schedule: 'Duyệt & lên lịch áp dụng',
  reject: 'Từ chối yêu cầu',
  cancel: 'Hủy yêu cầu đang mở',
}

const MODE_DESCRIPTIONS: Record<StaffTypeChangeDecisionMode, string> = {
  'apply-now':
    'BE sẽ chuyển request sang APPROVED rồi áp dụng ngay (nếu không có assignment cản trở).',
  schedule:
    'Chọn thời điểm tương lai để áp dụng. BE giữ request ở SCHEDULED cho đến khi tới hạn.',
  reject: 'Yêu cầu sẽ chuyển sang REJECTED và thông báo cho nhân viên.',
  cancel: 'Yêu cầu đang mở sẽ chuyển sang CANCELLED.',
}

export function AdminStaffTypeChangeDecisionModal({
  mode,
  request,
  onClose,
  onCompleted,
}: AdminStaffTypeChangeDecisionModalProps) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const approveForm = useForm<z.infer<typeof baseEffectiveAtSchema>>({
    resolver: zodResolver(baseEffectiveAtSchema) as Resolver<
      z.infer<typeof baseEffectiveAtSchema>
    >,
    defaultValues: {
      effective_at: '',
      handover_note: '',
      emergency_override: false,
      override_reason: '',
    },
  })
  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })
  const cancelForm = useForm<CancelFormValues>({
    resolver: zodResolver(cancelSchema),
    defaultValues: { reason: '' },
  })

  const effectiveAtInput = approveForm.watch('effective_at')
  const emergencyOverride = approveForm.watch('emergency_override')

  useEffect(() => {
    if (request && mode) {
      const isApproveLike = mode === 'apply-now' || mode === 'schedule'
      approveForm.reset({
        effective_at:
          mode === 'schedule'
            ? toDateTimeLocalInputValue(request.effective_at)
            : '',
        handover_note: request.handover_note ?? '',
        emergency_override: false,
        override_reason: '',
      })
      if (!isApproveLike) {
        rejectForm.reset({ reason: '' })
        cancelForm.reset({ reason: '' })
      }
      setError(null)
    }
  }, [request, mode, approveForm, rejectForm, cancelForm])

  const applyImmediately = mode === 'apply-now'

  /**
   * Snapshot impact (BE lưu `impact_snapshot` sau khi approve). BE cũng cung cấp
   * `can_apply_now` để gợi ý cho admin biết có cần emergency override hay không.
   */
  const snapshotImpact = request?.impact_snapshot ?? null
  const snapshotCanApplyNow = snapshotImpact?.can_apply_now ?? true
  const snapshotHasBlockers = (snapshotImpact?.blockers?.length ?? 0) > 0

  // Tự bật override khi BE snapshot cho thấy không thể áp dụng ngay.
  const needsOverride = applyImmediately && !snapshotCanApplyNow
  const overrideValue = emergencyOverride || needsOverride

  const fromLabel = useMemo(() => {
    if (!request) return ''
    return (
      STAFF_TYPE_LABELS[
        request.from_staff_type as keyof typeof STAFF_TYPE_LABELS
      ] ?? request.from_staff_type
    )
  }, [request])
  const toLabel = useMemo(() => {
    if (!request) return ''
    return (
      STAFF_TYPE_LABELS[
        request.to_staff_type as keyof typeof STAFF_TYPE_LABELS
      ] ?? request.to_staff_type
    )
  }, [request])

  if (!request || !mode) return null

  const handleApprove = async (values: ApproveFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      const payload: ApproveStaffTypeChangePayload = {}
      if (values.effective_at) {
        payload.effective_at = new Date(values.effective_at).toISOString()
      }
      if (values.handover_note) {
        payload.handover_note = values.handover_note
      }
      if (values.emergency_override) {
        payload.emergency_override = true
        payload.override_reason = values.override_reason
      }
      const result = await approveStaffTypeChangeRequestApi(
        request.id,
        payload,
      )
      if (result.status === 'APPLIED') {
        showToast(
          'Đã duyệt & áp dụng ngay. Staff sẽ được thông báo và cần đăng nhập lại để nhận capability mới.',
          'success',
        )
      } else if (result.status === 'SCHEDULED') {
        showToast(
          'Đã lên lịch áp dụng. Hệ thống sẽ tự động áp dụng khi tới thời điểm.',
          'success',
        )
      } else {
        showToast('Đã duyệt yêu cầu đổi chức năng.', 'success')
      }
      onCompleted?.()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể duyệt yêu cầu.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async (values: RejectFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await rejectStaffTypeChangeRequestApi(request.id, {
        reason: values.reason,
      })
      showToast('Đã từ chối yêu cầu.', 'success')
      onCompleted?.()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể từ chối yêu cầu.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = async (values: CancelFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      await cancelStaffTypeChangeRequestApi(request.id, {
        reason: values.reason,
      })
      showToast('Đã hủy yêu cầu.', 'success')
      onCompleted?.()
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể hủy yêu cầu.'))
    } finally {
      setSubmitting(false)
    }
  }

  const renderApproveForm = () => (
    <form
      onSubmit={approveForm.handleSubmit(handleApprove)}
      className="space-y-4"
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <p className="font-medium text-slate-800">Lý do nhân viên gửi</p>
        <p className="mt-1 text-slate-700">{request.reason}</p>
        {request.handover_note ? (
          <>
            <p className="mt-2 font-medium text-slate-800">Ghi chú bàn giao</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">
              {request.handover_note}
            </p>
          </>
        ) : null}
      </div>

      <div>
        <Label htmlFor="effective_at">
          {applyImmediately
            ? 'Thời điểm áp dụng (mặc định = ngay bây giờ)'
            : 'Thời điểm áp dụng (bắt buộc — tương lai)'}
        </Label>
        <input
          id="effective_at"
          type="datetime-local"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
          {...approveForm.register('effective_at')}
        />
        <p className="mt-1 text-xs text-slate-500">
          {applyImmediately
            ? 'Để trống = BE sẽ coi như áp dụng ngay khi duyệt.'
            : 'Nếu để trống BE sẽ báo lỗi; cần chọn thời điểm tương lai.'}
        </p>
        {approveForm.formState.errors.effective_at ? (
          <p className="mt-1 text-xs text-red-600">
            {approveForm.formState.errors.effective_at.message}
          </p>
        ) : null}
      </div>

      <div>
        <Label htmlFor="handover_note">Ghi chú bàn giao (tùy chọn)</Label>
        <Textarea
          id="handover_note"
          rows={2}
          placeholder="Cập nhật nếu khác với yêu cầu ban đầu của nhân viên."
          {...approveForm.register('handover_note')}
        />
      </div>

      {/* Impact snapshot (nếu BE đã lưu) */}
      {snapshotImpact ? (
        <div className="space-y-2">
          <Label>Ảnh hưởng BE đã snapshot</Label>
          <ImpactPreviewBlock
            impact={snapshotImpact}
            fromStaffType={request.from_staff_type}
            toStaffType={request.to_staff_type}
            compact
          />
        </div>
      ) : null}

      {/* Emergency override (hiện khi apply-now và có blocker / BE snapshot cho thấy không thể apply-now) */}
      {applyImmediately && (snapshotHasBlockers || needsOverride) ? (
        <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
          <label className="flex items-start gap-2 text-sm font-medium text-red-800">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-400"
              disabled={needsOverride && !emergencyOverride}
              {...approveForm.register('emergency_override')}
            />
            <span>
              {needsOverride
                ? 'Bắt buộc bật Emergency override'
                : 'Bật Emergency override (nếu cần bỏ qua blocker)'}
            </span>
          </label>
          <p className="ml-6 text-xs text-red-700">
            BE sẽ ghi nhận override kèm lý do vào audit log.
          </p>
          {overrideValue ? (
            <div>
              <Textarea
                id="override_reason"
                rows={2}
                placeholder="Lý do bắt buộc (≥5 ký tự)"
                {...approveForm.register('override_reason')}
              />
              {approveForm.formState.errors.override_reason ? (
                <p className="mt-1 text-xs text-red-600">
                  {approveForm.formState.errors.override_reason.message}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {effectiveAtInput && applyImmediately ? (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs text-blue-800">
          <ShieldAlert className="mt-0.5 h-4 w-4" />
          Thời điểm bạn chọn là tương lai — BE sẽ lên lịch thay vì áp dụng ngay.
        </div>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang xử lý...
            </>
          ) : applyImmediately ? (
            'Duyệt & áp dụng ngay'
          ) : (
            'Lên lịch áp dụng'
          )}
        </Button>
      </div>
    </form>
  )

  const renderRejectForm = () => (
    <form
      onSubmit={rejectForm.handleSubmit(handleReject)}
      className="space-y-4"
    >
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <p className="font-medium text-slate-800">Lý do nhân viên gửi</p>
        <p className="mt-1 text-slate-700">{request.reason}</p>
      </div>
      <div>
        <Label htmlFor="reason">Lý do từ chối</Label>
        <Textarea
          id="reason"
          rows={4}
          placeholder="Giải thích vì sao từ chối để nhân viên hiểu và điều chỉnh."
          {...rejectForm.register('reason')}
        />
        {rejectForm.formState.errors.reason ? (
          <p className="mt-1 text-xs text-red-600">
            {rejectForm.formState.errors.reason.message}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Đóng
        </Button>
        <Button type="submit" variant="danger" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang từ chối...
            </>
          ) : (
            'Từ chối yêu cầu'
          )}
        </Button>
      </div>
    </form>
  )

  const renderCancelForm = () => (
    <form
      onSubmit={cancelForm.handleSubmit(handleCancel)}
      className="space-y-4"
    >
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        Request đang ở trạng thái{' '}
        <strong>{STAFF_TYPE_CHANGE_STATUS_LABELS[request.status]}</strong>.
        Hành động này không thể hoàn tác.
      </div>
      <div>
        <Label htmlFor="reason">Lý do hủy</Label>
        <Textarea
          id="reason"
          rows={3}
          placeholder="Lý do admin hủy (staff sẽ được thông báo kèm lý do này)."
          {...cancelForm.register('reason')}
        />
        {cancelForm.formState.errors.reason ? (
          <p className="mt-1 text-xs text-red-600">
            {cancelForm.formState.errors.reason.message}
          </p>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={submitting}
        >
          Đóng
        </Button>
        <Button type="submit" variant="danger" disabled={submitting}>
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang hủy...
            </>
          ) : (
            'Hủy yêu cầu'
          )}
        </Button>
      </div>
    </form>
  )

  return (
    <Modal
      open={!!mode && !!request}
      onClose={submitting ? () => undefined : onClose}
      title={MODE_TITLES[mode]}
      description={MODE_DESCRIPTIONS[mode]}
    >
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className="font-medium text-slate-700">{fromLabel}</span>
        <span aria-hidden className="text-slate-400">→</span>
        <span className="font-medium text-slate-900">{toLabel}</span>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {mode === 'apply-now' || mode === 'schedule'
        ? renderApproveForm()
        : null}
      {mode === 'reject' ? renderRejectForm() : null}
      {mode === 'cancel' ? renderCancelForm() : null}
    </Modal>
  )
}
