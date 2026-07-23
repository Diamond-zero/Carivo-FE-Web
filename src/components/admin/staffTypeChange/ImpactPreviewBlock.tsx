import { AlertTriangle, Loader2, ShieldAlert } from 'lucide-react'
import type {
  ApiStaffTypeChangeImpact,
  ApiStaffTypeChangeImpactCapacity,
} from '../../../api/staffTypeChange.api'
import { STAFF_TYPE_LABELS } from '../../../constants/staffType'
import { cn } from '../../../lib/utils'

interface ImpactPreviewBlockProps {
  /** Ảnh hưởng trả về từ BE. `undefined` nghĩa là chưa gọi. */
  impact?: ApiStaffTypeChangeImpact | null
  isLoading?: boolean
  error?: unknown
  /** Nhãn "vai trò hiện tại" hiển thị cho người dùng. */
  fromStaffType?: string
  toStaffType?: string
  /** Khi bật, hiển thị thêm thông tin (compact = rút gọn dùng trong modal duyệt). */
  compact?: boolean
}

/**
 * Card hiển thị impact: active/future assignments, capacity, blockers, warnings,
 * can_apply_now. Đồng bộ với `buildStaffTypeChangeImpact` của BE.
 */
export function ImpactPreviewBlock({
  impact,
  isLoading = false,
  error = null,
  fromStaffType,
  toStaffType,
  compact = false,
}: ImpactPreviewBlockProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        Đang tính toán ảnh hưởng...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
        Không tính được ảnh hưởng. Bạn vẫn có thể tiếp tục, BE sẽ kiểm tra lại khi duyệt.
      </div>
    )
  }

  if (!impact) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Chọn vai trò và thời điểm áp dụng để xem trước ảnh hưởng.
      </div>
    )
  }

  const activeCount = impact.active_assignment_count ?? 0
  const futureCount = impact.future_assignment_count ?? 0
  const capacity: ApiStaffTypeChangeImpactCapacity | undefined = impact.capacity
  const blockers = impact.blockers ?? []
  const warnings = impact.warnings ?? []
  const canApplyNow = Boolean(impact.can_apply_now)
  const fromLabel =
    STAFF_TYPE_LABELS[
      (fromStaffType ?? impact.from_staff_type) as keyof typeof STAFF_TYPE_LABELS
    ] ?? fromStaffType ?? impact.from_staff_type
  const toLabel =
    STAFF_TYPE_LABELS[
      (toStaffType ?? impact.to_staff_type) as keyof typeof STAFF_TYPE_LABELS
    ] ?? toStaffType ?? impact.to_staff_type

  return (
    <div className="space-y-3" data-testid="impact-preview-block">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="font-medium text-slate-800">{fromLabel ?? '—'}</span>
        <span aria-hidden className="text-slate-400">→</span>
        <span className="font-medium text-slate-900">{toLabel ?? '—'}</span>
        <span
          className={cn(
            'ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
            canApplyNow
              ? 'bg-emerald-100 text-emerald-800 ring-emerald-200'
              : 'bg-amber-100 text-amber-800 ring-amber-200',
          )}
        >
          {canApplyNow ? 'Có thể áp dụng ngay' : 'Cần lên lịch'}
        </span>
      </div>

      <div
        className={cn(
          'grid gap-3',
          compact ? 'sm:grid-cols-2' : 'sm:grid-cols-3',
        )}
      >
        <ImpactStat
          label="Booking đang phụ trách"
          value={activeCount}
          tone={activeCount > 0 ? 'red' : 'slate'}
        />
        <ImpactStat
          label="Booking tương lai"
          value={futureCount}
          tone={futureCount > 0 ? 'amber' : 'slate'}
        />
        {capacity ? (
          <ImpactStat
            label="Capacity vị trí cũ → mới"
            value={`${capacity.source_before}→${capacity.source_after} / ${capacity.target_before}→${capacity.target_after}`}
            tone="brand"
            isText
          />
        ) : null}
      </div>

      {blockers.length > 0 ? (
        <div className="space-y-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="h-4 w-4" />
            Có vấn đề cần xử lý trước khi duyệt
          </p>
          <ul className="ml-5 list-disc space-y-0.5 text-xs">
            {blockers.map((b, idx) => (
              <li key={`${b.code}-${idx}`}>
                {b.message}
                {typeof b.count === 'number' ? ` (${b.count})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {warnings.length > 0 ? (
        <div className="space-y-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <p className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-4 w-4" />
            Lưu ý
          </p>
          <ul className="ml-5 list-disc space-y-0.5 text-xs">
            {warnings.map((w, idx) => (
              <li key={`${w.code}-${idx}`}>
                {w.message}
                {typeof w.count === 'number' ? ` (${w.count})` : ''}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function ImpactStat({
  label,
  value,
  tone,
  isText = false,
}: {
  label: string
  value: number | string
  tone: 'red' | 'amber' | 'brand' | 'slate'
  isText?: boolean
}) {
  const toneClass = {
    red: 'text-red-700',
    amber: 'text-amber-700',
    brand: 'text-brand-700',
    slate: 'text-slate-900',
  }[tone]
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p
        className={cn(
          isText ? 'mt-1 text-sm font-semibold' : 'mt-1 text-2xl font-semibold',
          toneClass,
        )}
      >
        {value}
      </p>
    </div>
  )
}
