import { useState } from 'react'
import { ChevronDown, CheckCircle2 } from 'lucide-react'
import type { BookingServiceStep } from '../../types/serviceStep'
import {
  STEP_STATUS_COLORS,
  STEP_STATUS_LABELS,
  STEP_TYPE_LABELS,
} from '../../constants/serviceStep'
import { STAFF_TYPE_LABELS } from '../../constants/staffType'
import { canCompleteStep } from '../../utils/serviceSteps'
import { cn } from '../../lib/utils'
import { Button } from '../ui/Button'

interface ServiceStepListProps {
  steps: BookingServiceStep[]
  onCompleteStep: (stepId: string) => void
  completingStepId?: string | null
}

export function ServiceStepList({
  steps,
  onCompleteStep,
  completingStepId = null,
}: ServiceStepListProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>(
    {},
  )

  const toggleInstructions = (stepId: string) => {
    setExpandedSteps((current) => ({
      ...current,
      [stepId]: !current[stepId],
    }))
  }

  if (steps.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Chưa có bước dịch vụ. Bấm &quot;Bắt đầu dịch vụ&quot; để tạo các bước.
      </p>
    )
  }

  return (
    <ul className="space-y-4">
      {steps.map((step) => {
        const isExpanded = expandedSteps[step.id] ?? step.status === 'IN_PROGRESS'
        const canComplete = canCompleteStep(step, steps)
        const isDone = step.status === 'DONE'

        return (
          <li
            key={step.id}
            className={cn(
              'rounded-2xl border p-4 transition-colors',
              isDone
                ? 'border-green-200 bg-green-50/50'
                : step.status === 'IN_PROGRESS'
                  ? 'border-amber-200 bg-amber-50/40'
                  : 'border-slate-200 bg-white',
            )}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-slate-500">
                    Bước {step.order}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {STEP_TYPE_LABELS[step.step_type]}
                  </span>
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      STEP_STATUS_COLORS[step.status],
                    )}
                  >
                    {STEP_STATUS_LABELS[step.status]}
                  </span>
                </div>

                <p className="mt-2 text-base font-semibold text-slate-900">
                  {step.step_name}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {STAFF_TYPE_LABELS[step.display_staff_type]}
                </p>
              </div>

              {canComplete ? (
                <Button
                  size="sm"
                  onClick={() => onCompleteStep(step.id)}
                  disabled={completingStepId === step.id}
                >
                  {completingStepId === step.id ? (
                    'Đang xử lý...'
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Hoàn thành step
                    </>
                  )}
                </Button>
              ) : isDone ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Đã xong
                </span>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => toggleInstructions(step.id)}
              className="mt-3 flex w-full items-center gap-2 text-left text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              <ChevronDown
                className={cn(
                  'h-4 w-4 transition-transform',
                  isExpanded && 'rotate-180',
                )}
              />
              Hướng dẫn ({step.instructions.length})
            </button>

            {isExpanded ? (
              <ul className="mt-2 space-y-1 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                {step.instructions.map((instruction) => (
                  <li key={instruction} className="flex gap-2">
                    <span className="text-slate-400">•</span>
                    <span>{instruction}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}
