import type { StaffCapability } from '../constants/staffCapabilities'
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
  /**
   * Capability yêu cầu để hiển thị nút hành động. Nếu Staff không có
   * capability này thì action không render trên UI (kể cả khi status hợp lệ).
   */
  requiredCapability: StaffCapability
}

export function isBookingInStaffGarage(
  booking: Booking,
  staffGarageId?: string,
): boolean {
  if (!staffGarageId) return true
  return booking.garage_id === staffGarageId
}

/**
 * Service package có yêu cầu care_staff hay không. Một số gói (đặc biệt là
 * detailing / interior) cần ít nhất một nhân viên care được chỉ định trước
 * khi service bắt đầu và trước khi hoàn thành. BE sẽ từ chối với 403 nếu
 * staff hiện tại không nằm trong danh sách `assigned_care_staff_ids` —
 * đây là dạng 403 mà user hay gặp với thông báo
 * "You do not have the required staff capability".
 */
export function bookingRequiresCareStaff(booking: Booking): boolean {
  if (booking.requires_care_staff != null) {
    return booking.requires_care_staff
  }
  const rawRequires = booking.raw?.requires_care_staff
  if (rawRequires != null) return rawRequires
  return booking.raw?.service_package?.requires_care_staff === true
}

/**
 * Staff hiện tại đã được gán cho booking chưa?
 *
 * Quy ước:
 *  - Nếu service không yêu cầu care_staff → không cần check, cho qua.
 *  - Nếu yêu cầu và chưa có ai được gán → trả 0, FE sẽ yêu cầu assign.
 *  - Nếu yêu cầu và đã có assignee mà staff hiện tại không thuộc nhóm →
 *    staff phải được admin (hoặc manager) gán vào danh sách trước.
 */
export function isCareStaffAssignedToBooking(
  booking: Booking,
  staffProfileId?: string,
): boolean {
  if (!staffProfileId) return false
  if (!bookingRequiresCareStaff(booking)) return true
  const ids = new Set(booking.assigned_care_staff_ids ?? [])
  return ids.has(staffProfileId)
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
  staffProfileId?: string,
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

  if (
    bookingRequiresCareStaff(booking) &&
    !isCareStaffAssignedToBooking(booking, staffProfileId)
  ) {
    const totalRequired = booking.care_staff_required_count ?? 0
    const assigned = booking.assigned_care_staff_ids?.length ?? 0
    if (assigned < Math.max(totalRequired, 1)) {
      return {
        allowed: false,
        reason: `Cần phân công đủ ${Math.max(totalRequired, 1)} nhân viên care trước khi hoàn thành (hiện đã có ${assigned}).`,
      }
    }
    return {
      allowed: false,
      reason:
        'Bạn không thuộc nhóm care_staff được phân công cho booking này. Liên hệ admin/manager để được gán.',
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
  /**
   * staff profile id (hoặc user id tùy schema). BE lưu `assigned_inspection_staff_id`
   * bằng user id — so sánh với `session.user.id`. Truyền `undefined` để skip check.
   */
  currentUserId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  // Sau claim-inspection flow: chỉ staff được gán hoặc admin mới tạo được.
  // Admin bypass (currentUserId undefined) → cho phép.
  if (currentUserId !== undefined) {
    if (
      booking.assigned_inspection_staff_id &&
      booking.assigned_inspection_staff_id !== currentUserId
    ) {
      return {
        allowed: false,
        reason: 'Booking đã có nhân viên kiểm tra khác nhận.',
      }
    }
  }

  // Sau khi có BEFORE_WASH inspection (assigned) → staff đã claim và đã khảo sát,
  // service bắt đầu được → không còn trong trạng thái "chờ tạo before_wash".
  // Vẫn cho phép tạo AFTER_WASH sau khi service xong (status IN_PROGRESS).
  if (!['CHECKED_IN', 'IN_PROGRESS'].includes(booking.status)) {
    return {
      allowed: false,
      reason: 'Chỉ booking CHECKED_IN hoặc IN_PROGRESS mới kiểm tra được.',
    }
  }

  if (booking.raw?.blocked_by_incident === true) {
    return {
      allowed: false,
      reason: 'Booking đang bị tạm dừng do sự cố — không thể kiểm tra.',
    }
  }

  return { allowed: true }
}

/**
 * Guard cho PATCH /staff/workspace/bookings/:bookingId/claim-inspection.
 *
 * Điều kiện hiển thị nút "Nhận kiểm tra":
 *  - Booking cùng garage
 *  - Status CHECKED_IN
 *  - Chưa có ai nhận (assigned_inspection_staff_id null)
 *  - Không bị incident hold
 *
 * Backend vẫn là nguồn xác thực cuối cùng (atomic check với $or) — guard chỉ để ẩn
 * nút khi điều kiện không khả thi.
 */
export function getClaimInspectionGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'CHECKED_IN') {
    return {
      allowed: false,
      reason: 'Chỉ booking đã check-in mới nhận kiểm tra được.',
    }
  }

  if (booking.assigned_inspection_staff_id) {
    return {
      allowed: false,
      reason: 'Booking đã có nhân viên kiểm tra nhận rồi.',
    }
  }

  if (booking.raw?.blocked_by_incident === true) {
    return {
      allowed: false,
      reason: 'Booking đang bị tạm dừng do sự cố.',
    }
  }

  return { allowed: true }
}

export function getHandoverGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'COMPLETED') {
    return {
      allowed: false,
      reason: 'Chỉ booking COMPLETED mới bàn giao được.',
    }
  }

  return { allowed: true }
}

export function getCancelBookingGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(booking.status)) {
    return {
      allowed: false,
      reason: 'Booking đã kết thúc, không thể hủy.',
    }
  }

  if (booking.status === 'IN_PROGRESS') {
    return {
      allowed: false,
      reason: 'Booking đang thực hiện — liên hệ quản lý nếu cần hủy.',
    }
  }

  return { allowed: true }
}

export function getMarkNoShowGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (booking.status !== 'CONFIRMED') {
    return {
      allowed: false,
      reason: 'Chỉ booking CONFIRMED mới đánh dấu no-show.',
    }
  }

  return { allowed: true }
}

export function getLateArrivalGuard(
  booking: Booking,
  staffGarageId?: string,
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  const raw = booking.raw
  const needsResolution =
    raw?.late_resolution_required === true || raw?.arrival_status === 'LATE'

  if (!needsResolution && booking.status !== 'CONFIRMED') {
    return {
      allowed: false,
      reason: 'Booking không ở trạng thái cần xử lý đến trễ.',
    }
  }

  if (!needsResolution) {
    return {
      allowed: false,
      reason: 'Khách chưa được hệ thống đánh dấu đến trễ.',
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
      requiredCapability: 'booking.check_in',
    }
  }

  if (booking.status === 'CHECKED_IN') {
    return {
      label: 'Bắt đầu DV',
      to: `/service/execution?bookingId=${booking.id}`,
      type: 'link',
      guard: getStartServiceGuard(booking, staffGarageId),
      requiredCapability: 'service_task.wash.execute_assigned',
    }
  }

  if (booking.status === 'IN_PROGRESS') {
    return {
      label: 'Tiếp tục',
      to: `/service/execution?bookingId=${booking.id}`,
      type: 'link',
      guard: getContinueServiceGuard(booking, staffGarageId),
      requiredCapability: 'service_task.wash.execute_assigned',
    }
  }

  if (
    booking.status === 'COMPLETED' &&
    (booking.payment_status === 'UNPAID' || booking.payment_status === 'PENDING')
  ) {
    return {
      label: booking.payment_status === 'PENDING' ? 'Thu tiền mặt' : 'Thanh toán',
      type: 'mark_paid',
      guard: getMarkPaidGuard(booking, staffGarageId),
      requiredCapability: 'booking.payment.collect_cash',
    }
  }

  if (booking.status === 'COMPLETED' && booking.payment_status === 'PAID') {
    return {
      label: 'Bàn giao xe',
      to: `/staff/handover/${booking.id}`,
      type: 'link',
      guard: getHandoverGuard(booking, staffGarageId),
      requiredCapability: 'booking_handover.manage_garage',
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
