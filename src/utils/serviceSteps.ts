import type { Booking } from '../types/booking'
import type { BookingServiceStep } from '../types/serviceStep'
import type { StaffType } from '../types/staffProfile'
import { bookingRequiresWashBay } from './washBay'

export const WASH_BAY_REQUIRED_FOR_AUTOMATED_STEP_MESSAGE =
  'Cần gán buồng rửa trước khi thực hiện bước rửa tự động.'

const CAR_STEPS_TEMPLATE: Array<{
  step_code: string
  step_name: string
  step_type: BookingServiceStep['step_type']
  display_staff_type: StaffType
  instructions: string[]
}> = [
  {
    step_code: 'INSPECT_CAR',
    step_name: 'Kiểm tra tổng quát ô tô',
    step_type: 'MANUAL_SERVICE_STEP',
    display_staff_type: 'VEHICLE_INSPECTION_STAFF',
    instructions: ['Kiểm tra thân vỏ', 'Ghi nhận vết xước', 'Kiểm tra lốp'],
  },
  {
    step_code: 'WASH_CAR_AUTO',
    step_name: 'Rửa ô tô tự động',
    step_type: 'AUTOMATED_WASH_STEP',
    display_staff_type: 'WASH_OPERATOR',
    instructions: ['Đưa xe vào buồng', 'Chọn chương trình', 'Sấy khô'],
  },
  {
    step_code: 'CARE_CAR',
    step_name: 'Vệ sinh nội thất',
    step_type: 'MANUAL_SERVICE_STEP',
    display_staff_type: 'VEHICLE_CARE_STAFF',
    instructions: ['Hút bụi', 'Lau taplo', 'Xịt thơm'],
  },
  {
    step_code: 'FINAL_CHECK',
    step_name: 'Kiểm tra cuối & bàn giao',
    step_type: 'MANUAL_SERVICE_STEP',
    display_staff_type: 'CUSTOMER_SERVICE_STAFF',
    instructions: ['Kiểm tra chất lượng', 'Thông báo khách', 'Hướng dẫn thanh toán'],
  },
]

const BIKE_STEPS_TEMPLATE = [
  {
    step_code: 'INSPECT_BIKE',
    step_name: 'Kiểm tra tổng quát xe máy',
    step_type: 'MANUAL_SERVICE_STEP' as const,
    display_staff_type: 'VEHICLE_INSPECTION_STAFF' as const,
    instructions: ['Kiểm tra gương', 'Kiểm tra lốp', 'Ghi nhận vết xước'],
  },
  {
    step_code: 'WASH_BIKE_AUTO',
    step_name: 'Rửa xe máy tự động',
    step_type: 'AUTOMATED_WASH_STEP' as const,
    display_staff_type: 'WASH_OPERATOR' as const,
    instructions: ['Đưa xe vào buồng', 'Chọn chương trình rửa', 'Sấy khô'],
  },
  {
    step_code: 'CARE_BIKE',
    step_name: 'Dọn dẹp chi tiết & bôi dầu',
    step_type: 'MANUAL_SERVICE_STEP' as const,
    display_staff_type: 'VEHICLE_CARE_STAFF' as const,
    instructions: ['Lau kính', 'Bôi dầu xích', 'Xịt bóng nhựa'],
  },
  {
    step_code: 'FINAL_CHECK',
    step_name: 'Kiểm tra cuối & bàn giao',
    step_type: 'MANUAL_SERVICE_STEP' as const,
    display_staff_type: 'CUSTOMER_SERVICE_STAFF' as const,
    instructions: ['Kiểm tra chất lượng', 'Thông báo khách', 'Hướng dẫn thanh toán'],
  },
]

export function createDefaultStepsForBooking(booking: Booking): BookingServiceStep[] {
  const template =
    booking.vehicle_type === 'CAR' ? CAR_STEPS_TEMPLATE : BIKE_STEPS_TEMPLATE
  const now = new Date().toISOString().slice(0, 19)

  return template.map((item, index) => ({
    id: `step-${booking.id}-${index + 1}`,
    booking_id: booking.id,
    step_code: item.step_code,
    step_name: item.step_name,
    order: index + 1,
    step_type: item.step_type,
    display_staff_type: item.display_staff_type,
    assigned_staff_id: null,
    confirmed_by_staff_id: null,
    status: index === 0 ? 'IN_PROGRESS' : 'PENDING',
    instructions: item.instructions,
    started_at: index === 0 ? now : null,
    completed_at: null,
  }))
}

export function isAutomatedWashStep(step: BookingServiceStep) {
  return step.step_type === 'AUTOMATED_WASH_STEP'
}

export function automatedStepRequiresAssignedBay(
  step: BookingServiceStep,
  booking?: Booking | null,
) {
  if (!booking) return false
  return isAutomatedWashStep(step) && bookingRequiresWashBay(booking)
}

export function priorStepsAreDone(
  step: BookingServiceStep,
  steps: BookingServiceStep[],
) {
  const priorSteps = steps.filter((item) => item.order < step.order)
  return priorSteps.every((item) => item.status === 'DONE')
}

export function canCompleteStep(
  step: BookingServiceStep,
  steps: BookingServiceStep[],
) {
  if (step.status === 'DONE' || step.status === 'SKIPPED') {
    return false
  }

  return priorStepsAreDone(step, steps)
}

export function canStartAutomatedWashStep(
  step: BookingServiceStep,
  booking: Booking | undefined,
  steps: BookingServiceStep[],
) {
  if (!automatedStepRequiresAssignedBay(step, booking)) {
    return true
  }

  return Boolean(booking?.wash_bay_id) && priorStepsAreDone(step, steps)
}

export function findStepToActivateAfterBayAssignment(
  steps: BookingServiceStep[],
  booking: Booking,
) {
  const ordered = [...steps].sort((a, b) => a.order - b.order)

  return ordered.find(
    (step) =>
      step.status === 'PENDING' &&
      priorStepsAreDone(step, steps) &&
      canStartAutomatedWashStep(step, booking, steps),
  )
}

export function areAllStepsDone(steps: BookingServiceStep[]) {
  return (
    steps.length > 0 &&
    steps.every((step) => step.status === 'DONE' || step.status === 'SKIPPED')
  )
}
