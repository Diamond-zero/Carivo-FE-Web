/**
 * BE `GET /staff-profiles/me/capabilities` — trả về workspace của nhân viên hiện
 * tại cùng tập capability quyết định UI có hiển thị nút hành động hay không.
 *
 * Canonical capability keys được định nghĩa trong
 * `BE/backend/src/shared/constants/staff.constant.js` STAFF_CAPABILITIES.
 * FE phải dùng đúng keys snake_case từ BE.
 */

/** Canonical capability keys — đồng bộ 1-1 với BE. */
export type StaffCapabilityKey =
  // Booking ops
  | 'booking.read_garage'
  | 'booking.read_assigned'
  | 'booking.workflow.read_garage'
  | 'booking.walk_in.create'
  | 'booking.cancel_customer_request'
  | 'booking.arrival.manage'
  | 'booking.check_in'
  | 'booking.plate_scan'
  | 'booking.arrival_queue'
  | 'booking.late_arrival.manage'
  | 'booking.wash_bay.assign'
  | 'booking.service.start'
  | 'booking.service.read_garage'
  | 'booking.service.complete'
  | 'booking.payment.collect_cash'
  | 'booking.cancel'
  | 'booking.mark_no_show'
  // Service tasks
  | 'service_task.read_assigned'
  | 'service_task.wash.execute_assigned'
  | 'service_task.care.execute_assigned'
  | 'service_item.pause'
  | 'service_item.resume'
  | 'service_item.complete_early'
  | 'service_item.confirm_complete'
  // Inspection
  | 'inspection.read_garage'
  | 'inspection.read_assigned'
  | 'inspection.create_assigned'
  | 'inspection.before_wash.create'
  | 'inspection.after_wash.create'
  // Handover
  | 'handover.prepare'
  | 'handover.release'
  // Incidents
  | 'incident.read_garage'
  | 'incident.read_assigned'
  | 'incident.report_wash_bay_failure'
  | 'incident.report_staff_unavailable'
  | 'incident.report_other_garage'
  | 'incident.record_customer_decision'
  | 'incident.compensation.issue'
  // Customer / waitlist / payment / voucher
  | 'customer.read_garage'
  | 'waitlist.manage_garage'
  | 'payment.manage_garage'
  | 'voucher.read_garage'
  | 'wash_history.read_garage'
  | 'booking_handover.manage_garage'
  // Customer cases
  | 'customer_case.read_garage'
  | 'customer_case.assign_garage'
  | 'customer_case.acknowledge'
  | 'customer_case.communicate_assigned'
  | 'customer_case.create_walk_in'
  | 'customer_case.technical_assess_assigned'
  | 'customer_case.sla.read_garage'

export interface ApiStaffCapabilityContext {
  /** Admin bypass tất cả capability checks. */
  is_admin: boolean
  user_id: string
  staff_profile_id: string | null
  staff_type: string | null
  staff_group: string | null
  /** Garage được phân công (null = staff chưa gán garage). */
  garage_id: string | null
  /** Danh sách capability đang active — keys snake_case từ BE. */
  capabilities: StaffCapabilityKey[]
}

export interface ApiStaffCapabilitiesResponse {
  success: boolean
  message: string
  data: ApiStaffCapabilityContext
}
