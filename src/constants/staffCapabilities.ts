/**
 * Canonical capability constants — đồng bộ 1-1 với
 * BE `backend/src/shared/constants/staff.constant.js` STAFF_CAPABILITIES.
 *
 * UI components phải dùng `useMyCapabilities()` (hooks/api/staff/useStaffCapabilities.ts)
 * thay vì hardcoded lookup theo staff_type.
 * Capability check: `capabilities.includes('booking.check_in')`
 */

export const STAFF_CAPABILITIES = Object.freeze({
  // Booking
  BOOKING_READ_GARAGE: 'booking.read_garage',
  BOOKING_READ_ASSIGNED: 'booking.read_assigned',
  BOOKING_WORKFLOW_READ_GARAGE: 'booking.workflow.read_garage',
  BOOKING_WALK_IN_CREATE: 'booking.walk_in.create',
  BOOKING_CANCEL_CUSTOMER_REQUEST: 'booking.cancel_customer_request',
  BOOKING_ARRIVAL_MANAGE: 'booking.arrival.manage',
  BOOKING_CHECK_IN: 'booking.check_in',
  BOOKING_PLATE_SCAN: 'booking.plate_scan',
  BOOKING_ARRIVAL_QUEUE: 'booking.arrival_queue',
  BOOKING_LATE_ARRIVAL_MANAGE: 'booking.late_arrival.manage',
  BOOKING_WASH_BAY_ASSIGN: 'booking.wash_bay.assign',
  BOOKING_SERVICE_START: 'booking.service.start',
  BOOKING_SERVICE_READ_GARAGE: 'booking.service.read_garage',
  BOOKING_SERVICE_COMPLETE: 'booking.service.complete',
  BOOKING_PAYMENT_COLLECT_CASH: 'booking.payment.collect_cash',
  BOOKING_CANCEL: 'booking.cancel',
  BOOKING_MARK_NO_SHOW: 'booking.mark_no_show',
  // Service tasks
  SERVICE_TASK_READ_ASSIGNED: 'service_task.read_assigned',
  SERVICE_TASK_WASH_EXECUTE_ASSIGNED: 'service_task.wash.execute_assigned',
  SERVICE_TASK_CARE_EXECUTE_ASSIGNED: 'service_task.care.execute_assigned',
  SERVICE_ITEM_PAUSE: 'service_item.pause',
  SERVICE_ITEM_RESUME: 'service_item.resume',
  SERVICE_ITEM_COMPLETE_EARLY: 'service_item.complete_early',
  SERVICE_ITEM_CONFIRM_COMPLETE: 'service_item.confirm_complete',
  // Inspection
  INSPECTION_READ_GARAGE: 'inspection.read_garage',
  INSPECTION_READ_ASSIGNED: 'inspection.read_assigned',
  INSPECTION_CLAIM_GARAGE: 'inspection.claim_garage',
  INSPECTION_CREATE_ASSIGNED: 'inspection.create_assigned',
  INSPECTION_BEFORE_WASH_CREATE: 'inspection.before_wash.create',
  INSPECTION_AFTER_WASH_CREATE: 'inspection.after_wash.create',
  // Handover
  HANDOVER_PREPARE: 'handover.prepare',
  HANDOVER_RELEASE: 'handover.release',
  // Incidents
  INCIDENT_READ_GARAGE: 'incident.read_garage',
  INCIDENT_READ_ASSIGNED: 'incident.read_assigned',
  INCIDENT_REPORT_WASH_BAY_FAILURE: 'incident.report_wash_bay_failure',
  INCIDENT_REPORT_STAFF_UNAVAILABLE: 'incident.report_staff_unavailable',
  INCIDENT_REPORT_OTHER_GARAGE: 'incident.report_other_garage',
  INCIDENT_RECORD_CUSTOMER_DECISION: 'incident.record_customer_decision',
  INCIDENT_COMPENSATION_ISSUE: 'incident.compensation.issue',
  // Customer / waitlist / payment / voucher
  CUSTOMER_READ_GARAGE: 'customer.read_garage',
  WAITLIST_MANAGE_GARAGE: 'waitlist.manage_garage',
  PAYMENT_MANAGE_GARAGE: 'payment.manage_garage',
  VOUCHER_READ_GARAGE: 'voucher.read_garage',
  WASH_HISTORY_READ_GARAGE: 'wash_history.read_garage',
  BOOKING_HANDOVER_MANAGE_GARAGE: 'booking_handover.manage_garage',
  // Customer cases
  CUSTOMER_CASE_READ_GARAGE: 'customer_case.read_garage',
  CUSTOMER_CASE_ASSIGN_GARAGE: 'customer_case.assign_garage',
  CUSTOMER_CASE_ACKNOWLEDGE: 'customer_case.acknowledge',
  CUSTOMER_CASE_COMMUNICATE_ASSIGNED: 'customer_case.communicate_assigned',
  CUSTOMER_CASE_CREATE_WALK_IN: 'customer_case.create_walk_in',
  CUSTOMER_CASE_TECHNICAL_ASSESS_ASSIGNED: 'customer_case.technical_assess_assigned',
  CUSTOMER_CASE_SLA_READ_GARAGE: 'customer_case.sla.read_garage',
} as const)

/** Tất cả capability keys dưới dạng union type. */
export type StaffCapability = typeof STAFF_CAPABILITIES[keyof typeof STAFF_CAPABILITIES]

/** Mảng tất cả giá trị — dùng cho enum validation phía BE. */
export const STAFF_CAPABILITY_VALUES = Object.freeze(
  Object.values(STAFF_CAPABILITIES),
)

export const CAPABILITY_LABELS: Record<StaffCapability, string> = {
  'booking.read_garage': 'Xem booking trong garage',
  'booking.read_assigned': 'Xem booking được phân công',
  'booking.workflow.read_garage': 'Xem workflow booking trong garage',
  'booking.walk_in.create': 'Tạo walk-in booking',
  'booking.cancel_customer_request': 'Hủy booking theo yêu cầu khách',
  'booking.arrival.manage': 'Quản lý đến xe (check-in, no-show)',
  'booking.check_in': 'Check-in khách',
  'booking.plate_scan': 'Quét biển số xe',
  'booking.arrival_queue': 'Xem hàng đợi xe đến',
  'booking.late_arrival.manage': 'Quản lý xe đến trễ',
  'booking.wash_bay.assign': 'Gán buồng rửa',
  'booking.service.start': 'Bắt đầu dịch vụ',
  'booking.service.read_garage': 'Xem tiến trình dịch vụ trong garage',
  'booking.service.complete': 'Hoàn tất dịch vụ',
  'booking.payment.collect_cash': 'Thu tiền mặt',
  'booking.cancel': 'Hủy booking',
  'booking.mark_no_show': 'Đánh dấu không đến',
  'service_task.read_assigned': 'Xem task được phân công',
  'service_task.wash.execute_assigned': 'Thực hiện rửa xe',
  'service_task.care.execute_assigned': 'Thực hiện care staff',
  'service_item.pause': 'Tạm dừng bước dịch vụ',
  'service_item.resume': 'Tiếp tục bước dịch vụ',
  'service_item.complete_early': 'Hoàn thành sớm bước dịch vụ',
  'service_item.confirm_complete': 'Xác nhận hoàn thành bước dịch vụ',
  'inspection.read_garage': 'Xem kiểm tra xe trong garage',
  'inspection.read_assigned': 'Xem kiểm tra được phân công',
  'inspection.claim_garage': 'Tự nhận booking để kiểm tra xe',
  'inspection.create_assigned': 'Tạo kiểm tra xe',
  'inspection.before_wash.create': 'Tạo kiểm tra trước rửa',
  'inspection.after_wash.create': 'Tạo kiểm tra sau rửa',
  'handover.prepare': 'Chuẩn bị bàn giao xe',
  'handover.release': 'Bàn giao xe',
  'incident.read_garage': 'Xem sự cố trong garage',
  'incident.read_assigned': 'Xem sự cố được phân công',
  'incident.report_wash_bay_failure': 'Báo sự cố buồng rửa',
  'incident.report_staff_unavailable': 'Báo nhân viên không khả dụng',
  'incident.report_other_garage': 'Báo sự cố khác',
  'incident.record_customer_decision': 'Ghi nhận quyết định khách',
  'incident.compensation.issue': 'Phát voucher bồi thường',
  'customer.read_garage': 'Xem thông tin khách hàng',
  'waitlist.manage_garage': 'Quản lý danh sách chờ',
  'payment.manage_garage': 'Quản lý thanh toán',
  'voucher.read_garage': 'Xem voucher trong garage',
  'wash_history.read_garage': 'Xem lịch sử rửa xe',
  'booking_handover.manage_garage': 'Quản lý bàn giao xe',
  'customer_case.read_garage': 'Xem hồ sơ khiếu nại',
  'customer_case.assign_garage': 'Phân công hồ sơ khiếu nại',
  'customer_case.acknowledge': 'Xác nhận tiếp nhận case',
  'customer_case.communicate_assigned': 'Liên lạc case được phân công',
  'customer_case.create_walk_in': 'Tạo case cho walk-in',
  'customer_case.technical_assess_assigned': 'Đánh giá kỹ thuật case được phân công',
  'customer_case.sla.read_garage': 'Xem dashboard SLA case',
}
