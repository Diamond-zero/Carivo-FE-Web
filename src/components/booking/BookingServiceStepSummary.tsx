import type { BookingServiceStep } from '../../types/serviceStep'
import {
  STEP_STATUS_COLORS,
  STEP_STATUS_LABELS,
} from '../../constants/serviceStep'
import { STAFF_TYPE_LABELS } from '../../constants/staffType'
import { cn } from '../../lib/utils'

interface BookingServiceStepSummaryProps {
  steps: BookingServiceStep[]
}

export function BookingServiceStepSummary({
  steps,
}: BookingServiceStepSummaryProps) {
  if (steps.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Chưa có bước dịch vụ — sẽ được tạo khi bắt đầu thực hiện.
      </p>
    )
  }

  const completedCount = steps.filter((step) => step.status === 'DONE').length

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">Tiến độ</span>
        <span className="font-medium text-slate-900">
          {completedCount}/{steps.length} bước hoàn thành
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <ul className="space-y-2">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900">
                {step.order}. {step.step_name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {STAFF_TYPE_LABELS[step.display_staff_type]}
              </p>
            </div>
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                STEP_STATUS_COLORS[step.status],
              )}
            >
              {STEP_STATUS_LABELS[step.status]}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
