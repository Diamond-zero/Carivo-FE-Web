import type { VehicleType } from './washBay'
import type { ApiBookingIncident, ApiCustomerVoucher } from './api/staff'

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW'

export type PaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'PARTIAL' | 'REFUNDED' | string
export type PaymentMethod = 'CASH' | 'PAYOS' | string

export interface Booking {
  id: string
  customer_id: string | null
  vehicle_id: string | null
  is_walk_in: boolean
  guest_name: string | null
  guest_phone: string | null
  guest_email: string | null
  garage_id: string
  /** Enriched via BE / app-side lookup — tên chi nhánh (admin displays). */
  garage_name?: string
  /** Enriched via BE — null nếu chưa khóa; BE sẽ cập nhật sau. */
  garage_address?: string | null
  wash_bay_id: string | null
  service_package_id: string
  license_plate: string
  vehicle_type: VehicleType
  booking_date: string
  start_time: string
  end_time: string
  original_price: number
  discount_amount: number
  final_price: number
  payment_method: PaymentMethod
  payment_status: PaymentStatus
  status: BookingStatus
  note: string | null
  /** Enriched from API — optional */
  service_package_name?: string
  /**
   * Số điểm ước tính sẽ cộng cho khách thân thiết khi hoàn tất dịch vụ —
   * lấy từ ServicePackage.points_earned (BE `/admin/bookings/:id` trả kèm).
   * Walk-in luôn là 0.
   */
  service_package_points_estimated?: number
  customer_name?: string | null
  customer_phone?: string | null
  requires_wash_bay?: boolean
  earned_points?: number
  wash_bay_name?: string
  wash_bay_code?: string
  wash_bay_status?: import('./washBay').WashBayStatus
  // === Bổ sung theo BE (P0.1) ===
  /** Trạng thái nghiệp vụ phái sinh — AWAITING_PAYMENT | AWAITING_CUSTOMER_DECISION | INCIDENT_HOLD. */
  operation_status?: string | null
  /** Incident đang hoạt động — nếu có thì các thao tác dịch vụ bị khóa. */
  active_incident?: ApiBookingIncident | null
  /** Nguồn hủy booking — CUSTOMER | GARAGE_INCIDENT | ADMIN | NO_SHOW. */
  cancellation_source?: string | null
  /** Voucher bồi thường gắn với booking (nếu có). */
  customer_voucher?: ApiCustomerVoucher | null
  /** Số tiền giảm từ voucher bồi thường (VND). */
  voucher_discount_amount?: number | null
  /** Toàn bộ field từ BE — không render UI, dùng cho debug/tích hợp sau.
   * Workspace mapper thêm field mở rộng (workflow_phase, available_actions,
   * blocked_by_incident, ...) không có trong ApiBooking → dùng kiểu
   * Record<string, unknown> & ApiBooking để TS không reject. */
  raw?: Record<string, unknown> & import('./api/staff').ApiBooking
  // === Bổ sung cho bookingActionGuards (không lộ trên UI ngoài guard hint) ===
  /** Service package có yêu cầu care_staff hay không. */
  requires_care_staff?: boolean
  /** Số nhân viên cần phân công. */
  care_staff_required_count?: number
  /** Danh sách staff_profile_id hiện đang được assign cho booking. */
  assigned_care_staff_ids?: string[]
  /**
   * ID user (BE lưu bằng user_id) của nhân viên kiểm tra đang phụ trách booking.
   * Được set khi:
   *   - Admin gán thủ công qua PATCH /staff/bookings/:id/assign-inspection-staff
   *   - Staff tự nhận qua PATCH /staff/workspace/bookings/:id/claim-inspection
   * InspectionPage dùng field này để filter booking cho VEHICLE_INSPECTION_STAFF.
   */
  assigned_inspection_staff_id?: string | null
}

export interface WalkInBookingForm {
  guest_name: string
  guest_phone: string
  guest_email?: string
  license_plate: string
  vehicle_type: VehicleType
  service_package_id: string
  /** Scheduled walk-in — omit when serve_now is true. */
  start_time?: string
  /** Immediate walk-in — BE sets current time and auto check-in. */
  serve_now?: boolean
  suggestion_days?: number
  add_on_service_ids?: string[]
  promotion_code?: string
  note?: string
}
