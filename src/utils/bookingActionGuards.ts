import type { Booking } from '../types/booking'
import type { BookingServiceStep } from '../types/serviceStep'
import {
  areAllStepsDone,
  automatedStepRequiresAssignedBay,
  canCompleteStep,
  WASH_BAY_REQUIRED_FOR_AUTOMATED_STEP_MESSAGE,
} from './serviceSteps'
import { bookingRequiresWashBay } from './washBay'

export interface ActionGuardResult {
  allowed: boolean
  reason?: string
}

export interface BookingListAction {
  label: string
  to?: string
  type: 'link' | 'mark_paid'
  guard: ActionGuardResult
}

export function isBookingInStaffGarage(
  booking: Booking,
  staffGarageId?: string,
): boolean {
  if (!staffGarageId) return true
  return booking.garage_id === staffGarageId
}

function garageGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult | null {
  if (!isBookingInStaffGarage(booking, staffGarageId)) {
    return {
      allowed: false,
      reason: 'Booking thuộc garage khác — staff không được thao tác.',
    }
  }
  return null
}

export function getCheckInGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'CONFIRMED') {
    return {
      allowed: false,
      reason: 'Chỉ booking CONFIRMED mới được check-in.',
    }
  }

  return { allowed: true }
}

export function getStartServiceGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'CHECKED_IN') {
    return {
      allowed: false,
      reason: 'Chỉ booking đã check-in mới được bắt đầu dịch vụ.',
    }
  }

  return { allowed: true }
}

export function getContinueServiceGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'IN_PROGRESS') {
    return {
      allowed: false,
      reason: 'Chỉ booking IN_PROGRESS mới tiếp tục được.',
    }
  }

  return { allowed: true }
}

export function getCompleteServiceGuard(
  booking: Booking,
  steps: BookingServiceStep[],
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'IN_PROGRESS') {
    return {
      allowed: false,
      reason: 'Chỉ booking IN_PROGRESS mới hoàn thành dịch vụ được.',
    }
  }

  if (bookingRequiresWashBay(booking) && !booking.wash_bay_id) {
    return {
      allowed: false,
      reason: 'Cần gán buồng rửa trước khi hoàn thành dịch vụ.',
    }
  }

  if (!areAllStepsDone(steps)) {
    return {
      allowed: false,
      reason: 'Cần hoàn thành tất cả các bước trước.',
    }
  }

  return { allowed: true }
}

export function getMarkPaidGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'COMPLETED') {
    return {
      allowed: false,
      reason: 'Chỉ booking COMPLETED mới được thu tiền.',
    }
  }

  if (booking.payment_status === 'PAID') {
    return {
      allowed: false,
      reason: 'Booking đã thanh toán.',
    }
  }

  return { allowed: true }
}

export function getAssignWashBayGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'IN_PROGRESS') {
    return {
      allowed: false,
      reason: 'Chỉ booking IN_PROGRESS mới gán buồng rửa.',
    }
  }

  if (booking.wash_bay_id) {
    return {
      allowed: false,
      reason: 'Booking đã có buồng rửa.',
    }
  }

  if (!bookingRequiresWashBay(booking)) {
    return {
      allowed: false,
      reason: 'Gói dịch vụ không yêu cầu buồng rửa.',
    }
  }

  return { allowed: true }
}

export function getCreateInspectionGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (!['CHECKED_IN', 'IN_PROGRESS'].includes(booking.status)) {
    return {
      allowed: false,
      reason: 'Chỉ booking CHECKED_IN hoặc IN_PROGRESS mới kiểm tra được.',
    }
  }

  return { allowed: true }
}

export function getCompleteStepGuard(
  step: BookingServiceStep,
  steps: BookingServiceStep[],
  booking?: Booking | null,
): ActionGuardResult {
  if (step.status === 'DONE' || step.status === 'SKIPPED') {
    return { allowed: false, reason: 'Bước đã hoàn thành.' }
  }

  if (!canCompleteStep(step, steps)) {
    return {
      allowed: false,
      reason: 'Hoàn thành các bước trước đó trước khi tiếp tục.',
    }
  }

  if (
    automatedStepRequiresAssignedBay(step, booking) &&
    !booking?.wash_bay_id
  ) {
    return {
      allowed: false,
      reason: WASH_BAY_REQUIRED_FOR_AUTOMATED_STEP_MESSAGE,
    }
  }

  return { allowed: true }
}

export function getBookingListAction(
  booking: Booking,
  staffGarageId?: string,
): BookingListAction | null {
  if (booking.status === 'CONFIRMED') {
    return {
      label: 'Check-in',
      to: `/bookings/check-in?bookingId=${booking.id}`,
      type: 'link',
      guard: getCheckInGuard(booking, staffGarageId),
    }
  }

  if (booking.status === 'CHECKED_IN') {
    return {
      label: 'Bắt đầu DV',
      to: `/service/execution?bookingId=${booking.id}`,
      type: 'link',
      guard: getStartServiceGuard(booking, staffGarageId),
    }
  }

  if (booking.status === 'IN_PROGRESS') {
    return {
      label: 'Tiếp tục',
      to: `/service/execution?bookingId=${booking.id}`,
      type: 'link',
      guard: getContinueServiceGuard(booking, staffGarageId),
    }
  }

  if (booking.status === 'COMPLETED' && booking.payment_status === 'UNPAID') {
    return {
      label: 'Thanh toán',
      type: 'mark_paid',
      guard: getMarkPaidGuard(booking, staffGarageId),
    }
  }

  return null
}

/** @deprecated Use getBookingListAction for guarded actions */
export function getBookingAction(booking: Booking) {
  const action = getBookingListAction(booking)
  if (!action || !action.guard.allowed || !action.to) return null
  return { label: action.label, to: action.to }
}
