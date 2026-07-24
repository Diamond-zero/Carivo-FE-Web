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

/**
 * Guard cho nút "Bắt đầu dịch vụ".
 *
 * Lưu ý phân quyền (BE `booking.routes.js` `:id/start-service`):
 *  - Backend yêu cầu capability `booking.service.start`.
 *  - Chỉ CUSTOMER_SERVICE_STAFF (và admin) mới có capability này.
 *  - WASH_OPERATOR / VEHICLE_CARE_STAFF KHÔNG có — họ chỉ thực thi các bước
 *    task được phân công sau khi service đã IN_PROGRESS.
 *  - FE phải ẩn nút cho staff không có capability để tránh 403
 *    `STAFF_CAPABILITY_REQUIRED`.
 */
export function getStartServiceGuard(
  booking: Booking,
  staffGarageId?: string,
  staffCapabilities: StaffCapability[] = [],
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  if (!staffCapabilities.includes('booking.service.start')) {
    return {
      allowed: false,
      reason:
        'Bạn không có quyền bắt đầu dịch vụ. Liên hệ Customer Service Staff để bắt đầu.',
    }
  }

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
  staffCapabilities: StaffCapability[] = [],
): ActionGuardResult {
  const garage = garageGuard(booking, staffGarageId)
  if (garage) return garage

  // Wash/Care staff chỉ thấy/tiếp tục booking khi BE đã gán và đã có
  // `service_item.*` action trong available_actions (vd pause/resume/complete).
  // Customer Service Staff dùng `booking.service.complete` để đóng booking.
  const hasAnyExecutionCap =
    staffCapabilities.includes('service_task.wash.execute_assigned') ||
    staffCapabilities.includes('service_task.care.execute_assigned')
  if (
    !hasAnyExecutionCap &&
    !staffCapabilities.includes('booking.service.read_garage')
  ) {
    return {
      allowed: false,
      reason:
        'Bạn không có quyền thực hiện dịch vụ cho booking này.',
    }
  }

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

  if (isBookingReleased(booking)) {
    return {
      allowed: false,
      reason: 'Booking đã bàn giao cho khách — không thể mở lại.',
    }
  }

  return { allowed: true }
}

/**
 * Booking đã "đóng workflow" (RELEASED) — không sinh action nào nữa.
 *
 * Signal "đã bàn giao" được suy ra theo thứ tự ưu tiên:
 *  1. `booking.raw.workflow_phase === 'RELEASED'` — workspace source
 *     `GET /staff/workspace/bookings` (BE `getWorkflowPhase` set RELEASED
 *     khi `handover.state === RELEASED`).
 *  2. `booking.raw.handover_state === 'RELEASED'` HOẶC
 *     `booking.raw.handover_released_at != null` — admin/staff list/detail
 *     (BE `getBookingHandoverSummaryMap` batch query + nhúng 2 field vào
 *     `toBookingDto`). Dùng `'handover_state' in booking.raw` để phân biệt
 *     "BE chưa rollout" (undefined property) vs "BE đã rollout nhưng
 *     booking không có handover" (property = null) — theo note từ BE team.
 *  3. Workspace source cũ (chưa migrate sang handover_state): nếu
 *     `available_actions` là mảng mà rỗng các action liên quan thì RELEASED.
 *  4. Không có signal đáng tin (vd customer list chưa rollout) → return
 *     `false` để không ẩn nhầm nút "Bàn giao xe".
 *
 * Booking sau khi được release giữ `booking.status === 'COMPLETED'`.
 * Trước đây chỉ dựa vào status hoặc heuristic `PAID + reward_processed` →
 * CS Staff (admin source) luôn thấy nút "Bàn giao xe" kể cả khi booking
 * đã được release. Fix này ưu tiên signal chính xác từ BE.
 */
export function isBookingReleased(booking: Booking): boolean {
  const raw = booking.raw as
    | {
        workflow_phase?: string
        available_actions?: unknown
        handover_state?: string | null
        handover_released_at?: string | null
      }
    | undefined

  // 1) Tin tưởng tuyệt đối vào `workflow_phase` — đây là single source of
  //    truth mà BE `getWorkflowPhase` set `RELEASED` ngay khi
  //    `handover.state === RELEASED` (xem
  //    `staffBookingWorkflow.service.js`).
  if (raw?.workflow_phase === 'RELEASED') {
    return true
  }

  // 2) Signal từ BE (admin/staff list/detail): `handover_state` và
  //    `handover_released_at`. Chỉ dùng khi BE thực sự trả field — check
  //    `in` để không false-positive khi chưa được trả (vd booking cũ
  //    trước lần rollout BE này, hoặc customer list chưa enrich).
  //    Lưu ý theo note từ BE team: nếu BE trả `handover_state: null` cho
  //    booking không có handover record thì đã được rollout → dùng
  //    `in` vẫn an toàn (kiểm tra sự tồn tại của property, không phải
  //    giá trị truthy).
  if (raw && 'handover_state' in raw && 'handover_released_at' in raw) {
    if (raw.handover_state === 'RELEASED') {
      return true
    }
    // BE có thể set `released_at` mà chưa update `state` (race nhỏ),
    // hoặc ngược lại. Coi như đã release khi 1 trong 2 khớp.
    if (raw.handover_released_at) {
      return true
    }
    return false
  }

  // 3) Workspace source cũ (chưa migrate sang bổ sung handover_state —
  //    hiện tại chỉ có `available_actions`).
  const hasAvailableActionsField = Array.isArray(raw?.available_actions)

  if (hasAvailableActionsField) {
    const actions = raw!.available_actions as string[]
    const stillOpen = actions.some((action) =>
      [
        'handover.prepare',
        'handover.walk_in_accept',
        'handover.release',
        'booking.payment.collect_cash',
        'booking.service.complete',
        'booking.service.start',
        'booking.cancel',
        'booking.mark_no_show',
        'service_item.confirm_complete',
      ].includes(action),
    )
    if (stillOpen) return false
    return true
  }

  // 4) Fallback: BE chưa rollout handover_state cho endpoint này (vd
  //    customer list `/bookings/me`). Không có signal đáng tin cậy → trả
  //    false để tránh ẩn nhầm nút "Bàn giao xe".
  return false
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
  staffCapabilities: StaffCapability[] = [],
): BookingListAction | null {
  // Booking đã bàn giao xong (handover.state = RELEASED) — workflow đóng
  // hoàn toàn, không còn action nào cho staff. `status === 'COMPLETED'`
  // không phân biệt "vừa xong dịch vụ" vs "đã bàn giao", nên phải dùng
  // `isBookingReleased` — đọc signal chính xác từ BE
  // (`workflow_phase` / `handover_state` / `handover_released_at` /
  // `available_actions`).
  if (isBookingReleased(booking)) {
    return null
  }

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
      // `booking.service.start` chỉ có ở CUSTOMER_SERVICE_STAFF/admin.
      // WASH_OPERATOR / VEHICLE_CARE_STAFF không có → nút không hiển thị.
      guard: getStartServiceGuard(booking, staffGarageId, staffCapabilities),
      requiredCapability: 'booking.service.start',
    }
  }

  if (booking.status === 'IN_PROGRESS') {
    return {
      label: 'Tiếp tục',
      to: `/service/execution?bookingId=${booking.id}`,
      type: 'link',
      guard: getContinueServiceGuard(booking, staffGarageId, staffCapabilities),
      // Hiển thị nút cho Wash/Care staff (đã được BE assign) hoặc Customer
      // Service Staff. Capability kiểm tra ở BookingTableAction → ẩn nút
      // nếu không có bất kỳ capability nào liên quan.
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

  // Booking COMPLETED → mở "Bàn giao xe" dù payment_status là gì.
  // BE sẽ chặn release nếu payment chưa settled (PAID/WAIVED) — flow mới:
  //   1. staff chuẩn bị bàn giao (handover.ready)
  //   2. khách (hoặc walk-in staff) accept tình trạng xe
  //   3. staff thu tiền (cash) / tạo PayOS link
  //   4. staff release
  // FE chỉ cần route staff vào /staff/handover để họ thực hiện các bước
  // theo thứ tự BE yêu cầu.
  if (booking.status === 'COMPLETED') {
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
export function getBookingAction(
  booking: Booking,
  staffCapabilities: StaffCapability[] = [],
) {
  const action = getBookingListAction(booking, undefined, staffCapabilities)
  if (!action || !action.guard.allowed || !action.to) return null
  return { label: action.label, to: action.to }
}
