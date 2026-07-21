import type { StaffType } from '../types/staffProfile'

/**
 * Capability-based permissions cho Staff.
 *
 * Mỗi `staff_type` được Admin phân công có một tập capability cố định — xem
 * `STAFF_TYPE_TRANSITION_HINTS` trong `constants/staffTypeChange.ts` để đối
 * chiếu. Sidebar, action button và route guard của Staff PHẢI lọc qua
 * `useCan(capability)` / `<Can capability=...>` thay vì check trực tiếp
 * `staff_type`. BE vẫn là nơi enforce cuối — đây chỉ là lớp UI.
 */
export const STAFF_CAPABILITIES = [
  // Booking — thao tác
  'booking.view',
  'booking.check_in',
  'booking.walk_in',
  'booking.mark_no_show',
  'booking.cancel',

  // Payment
  'payment.collect',

  // Service execution
  'service.start',
  'service.continue',
  'service.complete',
  'wash_bay.assign',
  'step.complete',

  // Inspection (trước / sau khi rửa)
  'inspection.create_before',
  'inspection.create_after',

  // Handover
  'handover.prepare',
  'handover.release',

  // Hồ sơ khiếu nại & voucher
  'case.view',
  'case.create_walk_in',
  'case.technical_assessment',
  'sla.dashboard.view',
  'voucher.issue',

  // Waitlist & arrival
  'waitlist.manage',
  'arrival.camera.view',

  // Lịch sử rửa / khách hàng
  'wash_history.view',
  'customer.view',
] as const

export type StaffCapability = (typeof STAFF_CAPABILITIES)[number]

export const STAFF_TYPE_CAPABILITIES: Record<StaffType, StaffCapability[]> = {
  CUSTOMER_SERVICE_STAFF: [
    'booking.view',
    'booking.check_in',
    'booking.walk_in',
    'booking.mark_no_show',
    'payment.collect',
    'handover.prepare',
    'handover.release',
    'case.view',
    'case.create_walk_in',
    'voucher.issue',
    'waitlist.manage',
    'wash_history.view',
    'customer.view',
  ],
  VEHICLE_INSPECTION_STAFF: [
    'booking.view',
    'booking.check_in',
    'inspection.create_before',
    'inspection.create_after',
    'wash_history.view',
    'waitlist.manage',
  ],
  WASH_OPERATOR: [
    'booking.view',
    'service.start',
    'service.continue',
    'service.complete',
    'wash_bay.assign',
    'step.complete',
    'wash_history.view',
    'customer.view',
  ],
  VEHICLE_CARE_STAFF: [
    'booking.view',
    'service.continue',
    'step.complete',
    'wash_history.view',
    'customer.view',
  ],
}

export const CAPABILITY_LABELS: Record<StaffCapability, string> = {
  'booking.view': 'Xem danh sách booking',
  'booking.check_in': 'Check-in khách',
  'booking.walk_in': 'Tạo walk-in booking',
  'booking.mark_no_show': 'Đánh dấu no-show',
  'booking.cancel': 'Hủy booking',
  'payment.collect': 'Thu tiền / xác nhận thanh toán',
  'service.start': 'Bắt đầu dịch vụ',
  'service.continue': 'Tiếp tục dịch vụ',
  'service.complete': 'Hoàn tất dịch vụ',
  'wash_bay.assign': 'Gán buồng rửa',
  'step.complete': 'Hoàn thành bước',
  'inspection.create_before': 'Kiểm tra trước khi rửa',
  'inspection.create_after': 'Kiểm tra sau khi rửa',
  'handover.prepare': 'Chuẩn bị bàn giao xe',
  'handover.release': 'Phát xe cho khách',
  'case.view': 'Xem hồ sơ khiếu nại',
  'case.create_walk_in': 'Tạo case cho walk-in',
  'case.technical_assessment': 'Đánh giá kỹ thuật case',
  'sla.dashboard.view': 'Xem dashboard SLA case',
  'voucher.issue': 'Phát voucher bồi thường',
  'waitlist.manage': 'Quản lý danh sách chờ',
  'arrival.camera.view': 'Xem camera cổng',
  'wash_history.view': 'Xem lịch sử rửa',
  'customer.view': 'Xem thông tin khách hàng',
}
