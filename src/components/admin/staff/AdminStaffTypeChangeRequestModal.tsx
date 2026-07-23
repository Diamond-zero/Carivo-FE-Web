import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowRightLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { z } from 'zod'
import { getApiErrorMessage } from '../../../api/client'
import {
  createAdminStaffTypeChangeRequestApi,
  createStaffTypeChangeRequestApi,
  getStaffTypeChangeImpactApi,
  type ApiStaffTypeChangeImpact,
  type ApiStaffTypeChangeRequest,
} from '../../../api/staffTypeChange.api'
import { ImpactPreviewBlock } from '../staffTypeChange/ImpactPreviewBlock'
import {
  STAFF_TYPE_CHANGE_STATUS_COLORS,
} from '../../../constants/staffTypeChange'
import {
  STAFF_TYPE_LABELS,
  STAFF_TYPES,
} from '../../../constants/staffType'
import {
  STAFF_TYPE_TRANSITION_HINTS,
  STAFF_TYPE_TRANSITION_TASKS,
} from '../../../constants/staffTypeChange'
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

type RequestFormValues = z.infer<typeof requestSchema>

interface AdminStaffTypeChangeRequestModalProps {
  open: boolean
  record: AdminStaffRecord | null
  onClose: () => void
  onSubmitted?: (request: ApiStaffTypeChangeRequest) => void
  /**
   * Cờ chuyển hướng endpoint tạo request.
   * - `true` → gọi `POST /staff-profiles/:id/type-change-requests` (admin directed, BE MVP).
   * - `false` → gọi `POST /staff-profiles/me/type-change-requests` (staff self, fallback).
   *
   * Mặc định `true` vì modal này do admin sử dụng; khi BE chưa sẵn sàng,
   * bật prop `useAdminDirectedEndpoint={false}` ở nơi gọi.
   */
  useAdminDirectedEndpoint?: boolean
}

export function AdminStaffTypeChangeRequestModal({
  open,
  record,
  onClose,
  onSubmitted,
  useAdminDirectedEndpoint = true,
}: AdminStaffTypeChangeRequestModalProps) {
  const { showToast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [impact, setImpact] = useState<ApiStaffTypeChangeImpact | null>(null)
  const [impactLoading, setImpactLoading] = useState(false)
  const [impactError, setImpactError] = useState<unknown>(null)

  const form = useForm<z.infer<typeof requestSchema>>({
    resolver: zodResolver(requestSchema) as Resolver<z.infer<typeof requestSchema>>,
    defaultValues: {
      to_staff_type: 'CUSTOMER_SERVICE_STAFF',
      reason: '',
      effective_at: '',
      handover_note: '',
      emergency_override: false,
      override_reason: '',
    },
  })

  useEffect(() => {
    if (open && record) {
      const current = record.profile.staff_type
      const fallback =
        STAFF_TYPES.find((type) => type !== current) ?? 'CUSTOMER_SERVICE_STAFF'
      form.reset({
        to_staff_type: fallback,
        reason: '',
        effective_at: '',
        handover_note: '',
        emergency_override: false,
        override_reason: '',
      })
      setError(null)
      setImpact(null)
      setImpactError(null)
    }
  }, [open, record, form])

  const toStaffType = form.watch('to_staff_type')
  const effectiveAt = form.watch('effective_at')
  const emergencyOverride = form.watch('emergency_override')

  // Debounce 400ms gọi impact khi đổi vai trò / thời điểm áp dụng.
  useEffect(() => {
    if (!open || !record) return
    if (record.profile.staff_type === toStaffType) {
      setImpact(null)
      return
    }
    const timer = window.setTimeout(() => {
      let cancelled = false
      setImpactLoading(true)
      setImpactError(null)
      const isoEffectiveAt = effectiveAt
        ? new Date(effectiveAt).toISOString()
        : new Date().toISOString()
      getStaffTypeChangeImpactApi(record.profile.id, {
        to_staff_type: toStaffType as
          | 'CUSTOMER_SERVICE_STAFF'
          | 'VEHICLE_INSPECTION_STAFF'
          | 'WASH_OPERATOR'
          | 'VEHICLE_CARE_STAFF',
        effective_at: isoEffectiveAt,
      })
        .then((data) => {
          if (!cancelled) setImpact(data)
        })
        .catch((err) => {
          if (!cancelled) setImpactError(err)
        })
        .finally(() => {
          if (!cancelled) setImpactLoading(false)
        })
      return () => {
        cancelled = true
      }
    }, 400)
    return () => window.clearTimeout(timer)
  }, [
    open,
    record,
    toStaffType,
    effectiveAt,
  ])

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
  const hasBlockers =
    (impact?.blockers?.length ?? 0) > 0 && !emergencyOverride

  const handleSubmit = async (values: RequestFormValues) => {
    if (sameType) {
      setError('Vai trò mới phải khác vai trò hiện tại.')
      return
    }
    if (hasBlockers) {
      setError(
        'BE phát hiện vấn đề cản trở. Bật "Emergency override" và nhập lý do để tiếp tục.',
      )
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
      const created = useAdminDirectedEndpoint
        ? await createAdminStaffTypeChangeRequestApi(record.profile.id, payload)
        : await createStaffTypeChangeRequestApi(payload)
      showToast('Đã tạo yêu cầu điều chuyển vị trí.', 'success')
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
      title="Tạo yêu cầu điều chuyển vị trí"
      description={`Đối với ${record.user.full_name} (${record.profile.staff_code}). Hệ thống sẽ kiểm tra ảnh hưởng trước khi tạo; admin vẫn cần duyệt riêng để điều chuyển có hiệu lực.`}
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
            placeholder="Điều chuyển theo nhu cầu vận hành, phù hợp với vị trí mới, v.v."
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
            <p className="mt-1 text-xs text-slate-500">
              Để trống = áp dụng ngay sau khi admin duyệt.
            </p>
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

        {/* Impact preview block */}
        <div>
          <Label>Ảnh hưởng dự kiến</Label>
          <div className="mt-1">
            <ImpactPreviewBlock
              impact={impact}
              isLoading={impactLoading}
              error={impactError}
              fromStaffType={record.profile.staff_type}
              toStaffType={toStaffType}
            />
          </div>
        </div>

        {/* Emergency override (chỉ hiện khi có blocker) */}
        {impact && (impact.blockers?.length ?? 0) > 0 ? (
          <div className="space-y-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-3">
            <label className="flex items-center gap-2 text-sm font-medium text-red-800">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-400"
                {...form.register('emergency_override')}
              />
              Bật Emergency override
              <span className="text-xs font-normal text-red-700">
                (BE sẽ cho phép tạo request dù có vấn đề cản trở)
              </span>
            </label>
            {emergencyOverride ? (
              <div>
                <Textarea
                  id="override_reason"
                  rows={2}
                  placeholder="Lý do bắt buộc: giải thích vì sao cần bỏ qua blocker"
                  {...form.register('override_reason')}
                />
                {form.formState.errors.override_reason ? (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.override_reason.message}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            disabled={submitting || sameType || hasBlockers}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4" />
                Tạo yêu cầu điều chuyển
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
