import type { StepStatus, StepType } from '../types/serviceStep'

export const STEP_STATUS_LABELS: Record<StepStatus, string> = {
  PENDING: 'Chờ',
  IN_PROGRESS: 'Đang làm',
  DONE: 'Xong',
  SKIPPED: 'Bỏ qua',
}

export const STEP_STATUS_COLORS: Record<StepStatus, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  DONE: 'bg-green-100 text-green-700',
  SKIPPED: 'bg-gray-100 text-gray-600',
}

export const STEP_TYPE_LABELS: Record<StepType, string> = {
  AUTOMATED_WASH_STEP: 'Tự động',
  MANUAL_SERVICE_STEP: 'Thủ công',
}
