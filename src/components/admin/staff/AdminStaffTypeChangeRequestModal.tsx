import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getApiErrorMessage } from '../../../api/client'
import {
  createStaffTypeChangeRequestApi,
  type ApiStaffTypeChangeRequest,
} from '../../../api/staffTypeChange.api'
import {
  STAFF_TYPE_CHANGE_STATUS_COLORS,
  STAFF_TYPE_CHANGE_STATUS_LABELS,
} from '../../../constants/staffTypeChange'
import {
  STAFF_TYPE_LABELS,
  STAFF_TYPES,
  STAFF_TYPE_TRANSITION_HINTS,
  STAFF_TYPE_TRANSITION_TASKS,
} from '../../../constants/staffType'
import type { AdminStaffRecord } from '../../../types/admin'
import { useToast } from '../../../contexts/ToastContext'
import { Button } from '../../ui/Button'
import { Label } from '../../ui/Label'
import { Modal } from '../../ui/Modal'
import { Select } from '../../ui/Select'
import { Textarea } from '../../ui/Textarea'
import { cn } from '../../../lib/utils'

const requestSchema = z
  .object({
    to_staff_type: z.enum(
      [
        'CUSTOMER_SERVICE_STAFF',
        'VEHICLE_INSPECTION_STAFF',
        'WASH_OPERATOR',
        'VEHICLE_CARE_STAFF',
      ] as const,
      { message: 'Chọn chức năng muốn chuyển đến.' },
    ),
    reason: z
      .string()
      .min(5, 'Vui lòng nhập lý do (tối thiểu 5 ký tự).')
      .max(1000),
    effective_at: z.string().optional(),
    handover_note: z.string().max(2000).optional(),
  })
  .strict()

type RequestFormValues = z.infer<typeof requestSchema>

interface AdminStaffTypeChangeRequestModalProps {
  open: boolean
  record: AdminStaffRecord | null
  onClose: () => void
  onSubmitted?: (request: ApiStaffTypeChangeRequest) => void
}

export function AdminStaffTypeChangeRequestModal({
  open,
  record,
  onClose,
  onSubmitted,
}: AdminStaffTypeChangeRequestModalProps) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      to_staff_type: 'CUSTOMER_SERVICE_STAFF',
      reason: '',
      effective_at: '',
      handover_note: '',
    },
  })

  useEffect(() => {
    if (open && record) {
      // Mặc định chọn giá trị KHÁC vai trò hiện tại.
      const current = record.profile.staff_type
      const fallback =
        STAFF_TYPES.find((type) => type !== current) ?? 'CUSTOMER_SERVICE_STAFF'
      form.reset({
        to_staff_type: fallback,
        reason: '',
        effective_at: '',
        handover_note: '',
      })
      setError(null)
    }
  }, [open, record, form])

  const toStaffType = form.watch('to_staff_type')

  if (!record) return null

  const fromLabel =
    STAFF_TYPE_LABELS[record.profile.staff_type] ?? record.profile.staff_type
  const toLabel =
    STAFF_TYPE_LABELS[
      toStaffType as keyof typeof STAFF_TYPE_LABELS
    ] ?? toStaffType
  const toHint = STAFF_TYPE_TRANSITION_HINTS[
    toStaffType as keyof typeof STAFF_TYPE_TRANSITION_HINTS
  ]
  const toTasks = STAFF_TYPE_TRANSITION_TASKS[
    toStaffType as keyof typeof STAFF_TYPE_TRANSITION_TASKS
  ]

  const sameType = record.profile.staff_type === toStaffType

  const handleSubmit = async (values: RequestFormValues) => {
    if (sameType) {
      setError('Vai trò mới phải khác vai trò hiện tại.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const payload = {
        to_staff_type: values.to_staff_type,
        reason: values.reason,
        ...(values.effective_at
          ? { effective_at: new Date(values.effective_at).toISOString() }
          : {}),
        ...(values.handover_note ? { handover_note: values.handover_note } : {}),
      }
      const created = await createStaffTypeChangeRequestApi(payload)
      showToast('Đã gửi yêu cầu đổi chức năng.', 'success')
      onSubmitted?.(created)
      onClose()
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi yêu cầu.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => undefined : onClose}
      title="Yêu cầu chuyển chức năng"
      description={`Đối với ${record.user.full_name} (${record.profile.staff_code}). BE sẽ tạo yêu cầu để admin khác duyệt.`}
    >
      <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            STAFF_TYPE_CHANGE_STATUS_COLORS.REQUESTED,
          )}
        >
          {fromLabel}
        </span>
        <ArrowRightLeft className="h-4 w-4 text-slate-400" aria-hidden />
        <span
          className={cn(
            'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            STAFF_TYPE_CHANGE_STATUS_COLORS.APPROVED,
          )}
        >
          {toLabel}
        </span>
      </div>

      {error ? (
        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="to_staff_type">Chức năng muốn chuyển đến</Label>
          <Select
            id="to_staff_type"
            error={form.formState.errors.to_staff_type?.message}
            {...form.register('to_staff_type')}
          >
            {STAFF_TYPES.filter((t) => t !== record.profile.staff_type).map(
              (type) => (
                <option key={type} value={type}>
                  {STAFF_TYPE_LABELS[type]}
                </option>
              ),
            )}
          </Select>
          {toHint ? (
            <p className="mt-1 text-xs text-slate-500">{toHint}</p>
          ) : null}
          {toTasks ? (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2">
                <p className="text-xs font-semibold text-emerald-800">
                  Được thêm
                </p>
                <ul className="mt-1 list-disc pl-4 text-xs text-emerald-900">
                  {toTasks.gained.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2">
                <p className="text-xs font-semibold text-amber-800">Mất đi</p>
                <ul className="mt-1 list-disc pl-4 text-xs text-amber-900">
                  {toTasks.lost.map((g) => (
                    <li key={g}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        <div>
          <Label htmlFor="reason">Lý do chuyển</Label>
          <Textarea
            id="reason"
            rows={3}
            placeholder="Nhu cầu phát triển, phù hợp với vị trí mới, v.v."
            {...form.register('reason')}
          />
          {form.formState.errors.reason ? (
            <p className="mt-1 text-xs text-red-600">
              {form.formState.errors.reason.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="effective_at">Thời điểm áp dụng (tùy chọn)</Label>
            <input
              id="effective_at"
              type="datetime-local"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              {...form.register('effective_at')}
            />
          </div>
          <div>
            <Label htmlFor="handover_note">Ghi chú bàn giao (tùy chọn)</Label>
            <Textarea
              id="handover_note"
              rows={2}
              placeholder="Hướng dẫn bàn giao booking/step đang phụ trách."
              {...form.register('handover_note')}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={submitting || sameType}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4" />
                Gửi yêu cầu
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
