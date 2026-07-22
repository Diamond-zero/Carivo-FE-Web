import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getApiErrorMessage } from '../../../api/client'
import {
  approveStaffTypeChangeRequestApi,
  rejectStaffTypeChangeRequestApi,
  type ApiStaffTypeChangeRequest,
} from '../../../api/staffTypeChange.api'
import { STAFF_TYPE_LABELS } from '../../../constants/staffType'
import { STAFF_TYPE_CHANGE_STATUS_LABELS } from '../../../constants/staffTypeChange'
import { useToast } from '../../../contexts/ToastContext'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Textarea } from '../../ui/Textarea'

const decisionSchema = z
  .object({
    effective_at: z
      .string()
      .optional()
      .refine(
        (val) => !val || !Number.isNaN(new Date(val).getTime()),
        'Thời điểm áp dụng không hợp lệ',
      ),
  })
  .strict()

const rejectSchema = z.object({
  reason: z
    .string()
    .min(5, 'Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự).')
    .max(1000),
})

type DecisionFormValues = z.infer<typeof decisionSchema>
type RejectFormValues = z.infer<typeof rejectSchema>

interface AdminStaffTypeChangeDecisionModalProps {
  mode: 'approve' | 'reject'
  request: ApiStaffTypeChangeRequest | null
  onClose: () => void
  onCompleted?: () => void
}

function toDateTimeLocalInputValue(iso?: string | null) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  // Pad zero cho giờ/phút theo local time.
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
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

  const isApprove = mode === 'approve'

  const decisionForm = useForm<DecisionFormValues>({
    resolver: zodResolver(decisionSchema),
    defaultValues: {
      effective_at: '',
    },
  })

  const rejectForm = useForm<RejectFormValues>({
    resolver: zodResolver(rejectSchema),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (request) {
      decisionForm.reset({
        effective_at: toDateTimeLocalInputValue(request.effective_at),
      })
      rejectForm.reset({ reason: '' })
      setError(null)
    }
  }, [request, decisionForm, rejectForm])

  if (!request) return null

  const handleApprove = async (values: DecisionFormValues) => {
    setSubmitting(true)
    setError(null)
    try {
      const payload: { effective_at?: string } = {}
      if (values.effective_at) {
        payload.effective_at = new Date(values.effective_at).toISOString()
      }
      await approveStaffTypeChangeRequestApi(request.id, payload)
      showToast('Đã duyệt yêu cầu đổi chức năng.', 'success')
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

  const fromLabel =
    STAFF_TYPE_LABELS[
      request.from_staff_type as keyof typeof STAFF_TYPE_LABELS
    ] ?? request.from_staff_type
  const toLabel =
    STAFF_TYPE_LABELS[
      request.to_staff_type as keyof typeof STAFF_TYPE_LABELS
    ] ?? request.to_staff_type

  return (
    <Modal
      open={!!request}
      onClose={submitting ? () => undefined : onClose}
      title={isApprove ? 'Duyệt yêu cầu đổi chức năng' : 'Từ chối yêu cầu'}
      description={
        <span>
          <span className="font-medium text-slate-700">{fromLabel}</span>
          <span aria-hidden> → </span>
          <span className="font-medium text-slate-900">{toLabel}</span>
          {' · '}
          <span className="text-xs text-slate-500">
            Trạng thái hiện tại:{' '}
            {STAFF_TYPE_CHANGE_STATUS_LABELS[request.status] ?? request.status}
          </span>
        </span>
      }
    >
      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {isApprove ? (
        <form
          onSubmit={decisionForm.handleSubmit(handleApprove)}
          className="space-y-4"
        >
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
            <p className="font-medium text-slate-800">Lý do nhân viên gửi</p>
            <p className="mt-1 text-slate-700">{request.reason}</p>
          </div>

          <div>
            <Label htmlFor="effective_at">
              Thời điểm áp dụng (tùy chọn)
            </Label>
            <input
              id="effective_at"
              type="datetime-local"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...decisionForm.register('effective_at')}
            />
            <p className="mt-1 text-xs text-slate-500">
              Nếu để trống, yêu cầu sẽ chuyển sang trạng thái{' '}
              <strong>APPROVED</strong> và chờ BE áp dụng.
            </p>
            {decisionForm.formState.errors.effective_at ? (
              <p className="mt-1 text-xs text-red-600">
                {decisionForm.formState.errors.effective_at.message}
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
              Hủy
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang duyệt...
                </>
              ) : (
                'Duyệt yêu cầu'
              )}
            </Button>
          </div>
        </form>
      ) : (
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
            <Button
              type="submit"
              variant="danger"
              disabled={submitting}
            >
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
      )}
    </Modal>
  )
}
