import type { VehicleType } from '../washBay'

export interface ApiBookingCustomer {
  id: string
  full_name: string
  email: string
  phone: string
  role: string
  is_active: boolean
}

export interface ApiBookingVehicle {
  id: string
  raw_license_plate: string
  normalized_license_plate: string
  vehicle_type: VehicleType
  engine_type?: 'GASOLINE' | 'ELECTRIC' | null
  motorbike_cc_group?: 'UNDER_175CC' | 'OVER_175CC' | null
  car_body_type?: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MPV' | 'PICKUP' | 'VAN' | null
  seat_count?: number | null
  brand?: string
  model?: string
  color?: string
  is_active: boolean
}

export interface ApiBookingServicePackage {
  id: string
  name: string
  vehicle_type: VehicleType
  service_type: string
  base_price: number
  duration_minutes: number
  wash_bay_duration_minutes?: number
  points_earned: number
  requires_wash_bay: boolean
  requires_care_staff?: boolean
  is_active: boolean
}

export interface ApiBookingWashBay {
  id: string
  name: string
  bay_code: string
  vehicle_type: VehicleType
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE'
  is_active: boolean
}

export interface ApiBookingStaffUser {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  avatar_url?: string | null
  role?: string
  is_active?: boolean
}

export interface ApiBookingStaffProfile {
  id: string
  user_id?: string | null
  user?: ApiBookingStaffUser | null
  staff_code?: string | null
  staff_type?: string | null
  staff_group?: string | null
  garage_id?: string | null
  is_active?: boolean
}

export interface ApiBookingAssignedCareStaff {
  staff_profile_id?: string
  staff_profile?: ApiBookingStaffProfile | null
  user_id?: string
  user?: ApiBookingStaffUser | null
  assigned_at?: string
  released_at?: string | null
}

export type ApiBookingItemSource = 'PRIMARY' | 'COMBO_INCLUDED' | 'ADD_ON' | string

export interface ApiBookingItem {
  item_key: string
  service_package_id: string
  source: ApiBookingItemSource
  parent_combo_id?: string | null
  name_snapshot: string
  price_snapshot: number
  duration_minutes: number
  item_start_time: string
  item_end_time: string
  sequence: number
  requires_wash_bay: boolean
  wash_bay_start_time?: string | null
  wash_bay_end_time?: string | null
  wash_bay_work_end_time?: string | null
  wash_bay_reserved_until?: string | null
  requires_care_staff: boolean
  care_staff_type?: string | null
  care_staff_required_count?: number
  care_staff_start_time?: string | null
  care_staff_end_time?: string | null
  care_staff_work_end_time?: string | null
  care_staff_reserved_until?: string | null
  assigned_care_staff?: ApiBookingAssignedCareStaff[]
  assigned_execution_staff?: ApiBookingAssignedCareStaff[]
  status: string
}

export type ApiPromotionDiscountType = 'PERCENTAGE' | 'FIXED' | string
export type ApiPromotionAudience = 'ALL' | string

export interface ApiBookingPromotion {
  id: string
  code: string
  name: string
  description?: string | null
  discount_type: ApiPromotionDiscountType
  discount_value: number
  max_discount_amount?: number | null
  min_order_amount?: number | null
  audience: ApiPromotionAudience
  phone_required?: boolean
  per_phone_limit?: number | null
  applicable_tiers?: string[]
  applicable_vehicle_types?: VehicleType[]
  applicable_service_package_ids?: string[]
  start_at?: string
  end_at?: string
  usage_limit?: number | null
  per_customer_limit?: number | null
  used_count?: number
  reserved_count?: number
  is_active: boolean
  created_by_id?: string | null
  updated_by_id?: string | null
  created_at?: string
  updated_at?: string
}

export type ApiBookingArrivalStatus = 'EARLY' | 'ON_TIME' | 'LATE' | string
export type ApiLateResolution =
  | 'ACCEPT_WITHIN_ORIGINAL_WINDOW'
  | 'RESCHEDULED'
  | string

export interface ApiBooking {
  id: string
  customer_id: string | null
  customer?: ApiBookingCustomer | null
  vehicle_id: string | null
  vehicle?: ApiBookingVehicle | null
  is_walk_in: boolean
  guest_name: string | null
  guest_phone: string | null
  normalized_guest_phone?: string | null
  guest_email: string | null
  claimed_customer_id?: string | null
  claimed_at?: string | null
  license_plate: string | null
  normalized_license_plate?: string | null
  vehicle_type: VehicleType
  quoted_vehicle_snapshot?: import('./pricing').VehiclePricingSnapshot | null
  verified_vehicle_snapshot?: import('./pricing').VehiclePricingSnapshot | null
  pricing_review_status?: 'NOT_REQUIRED' | 'REVIEW_REQUIRED' | 'CUSTOMER_ACCEPTED'
  created_by_staff_id?: string | null
  garage_id: string
  wash_bay_id: string | null
  wash_bay?: ApiBookingWashBay | null
  service_package_id: string
  service_package?: ApiBookingServicePackage | null
  add_on_service_ids?: string[]
  booking_items?: ApiBookingItem[]
  booking_date: string
  start_time: string
  end_time: string
  wash_bay_start_time?: string | null
  wash_bay_end_time?: string | null
  wash_bay_work_end_time?: string | null
  wash_bay_reserved_until?: string | null
  requires_care_staff?: boolean
  care_staff_type?: string | null
  care_staff_required_count?: number
  care_staff_start_time?: string | null
  care_staff_end_time?: string | null
  care_staff_work_end_time?: string | null
  care_staff_reserved_until?: string | null
  assigned_care_staff_ids?: string[]
  assigned_care_staff?: ApiBookingStaffProfile[]
  original_price: number
  promotion_discount_amount?: number
  points_discount_amount?: number
  discount_amount: number
  final_price: number
  payment_method: 'CASH' | 'PAYOS' | string
  payment_status:
    | 'UNPAID'
    | 'PENDING'
    | 'PAID'
    | 'PARTIAL'
    | 'REFUNDED'
    | 'WAIVED'
    | string
  used_points?: number
  earned_points?: number
  promotion_id?: string | null
  promotion?: ApiBookingPromotion | null
  requires_wash_bay?: boolean
  status: string
  arrival_status?: ApiBookingArrivalStatus | null
  arrived_at?: string | null
  arrival_reference_start_time?: string | null
  late_minutes?: number
  grace_exceeded_minutes?: number
  late_resolution?: ApiLateResolution | null
  late_resolution_required?: boolean
  late_accepted_by_id?: string | null
  late_accepted_at?: string | null
  late_resolution_note?: string | null
  original_start_time?: string | null
  original_end_time?: string | null
  rescheduled_at?: string | null
  rescheduled_by_id?: string | null
  reschedule_reason?: string | null
  reschedule_count?: number
  checked_in_at?: string | null
  started_at?: string | null
  completed_at?: string | null
  paid_at?: string | null
  canceled_at?: string | null
  canceled_by_id?: string | null
  cancel_reason?: string | null
  no_show_at?: string | null
  no_show_by_id?: string | null
  no_show_by?: Record<string, unknown> | null
  no_show_reason?: string | null
  reward_processed?: boolean
  reward_processed_at?: string | null
  // === Bổ sung theo BE (handover summary trong admin/staff list & detail) ===
  /** Trạng thái handover: 'PENDING' | 'READY_FOR_CUSTOMER' | 'ON_HOLD' | 'RELEASED' | null */
  handover_state?: 'PENDING' | 'READY_FOR_CUSTOMER' | 'ON_HOLD' | 'RELEASED' | null
  /** ISO timestamp khi handover chuyển sang RELEASED. null nếu chưa release hoặc không có handover. */
  handover_released_at?: string | null
  note: string | null
  created_at?: string
  updated_at?: string
  // === Bổ sung theo BE (booking-incident-workflow.md + staff-api-changes.md section 6) ===
  /** Trạng thái nghiệp vụ phái sinh — AWAITING_PAYMENT | AWAITING_CUSTOMER_DECISION | INCIDENT_HOLD | ... */
  operation_status?: string | null
  /** ID của incident đang hoạt động (nếu có). */
  active_incident_id?: string | null
  /** Chi tiết incident đang hoạt động. */
  active_incident?: ApiBookingIncident | null
  /** Nguồn hủy: CUSTOMER | GARAGE_INCIDENT | ADMIN | NO_SHOW | ... */
  cancellation_source?: string | null
  /** ID incident dẫn tới hủy booking (nếu cancellation_source = GARAGE_INCIDENT). */
  cancellation_incident_id?: string | null
  /** Voucher bồi thường (compensation) gắn với booking. */
  customer_voucher_id?: string | null
  customer_voucher?: ApiCustomerVoucher | null
  /** Số tiền giảm từ voucher bồi thường (VND). */
  voucher_discount_amount?: number | null
  /** Staff hành chính phụ trách kiểm tra xe (admin assign). */
  assigned_inspection_staff_id?: string | null
  assigned_inspection_staff?: Record<string, unknown> | null
}

/** BE trả về trong `incident/active` và embedded trong `Booking.active_incident`. */
export interface ApiBookingIncident {
  id: string
  booking_id: string
  incident_type:
    | 'WASH_BAY_FAILURE'
    | 'STAFF_UNAVAILABLE'
    | 'OTHER_GARAGE_INCIDENT'
    | string
  description?: string | null
  affected_booking_item_key?: string | null
  affected_wash_bay_id?: string | null
  affected_staff_profile_id?: string | null
  released_booking_item_keys?: string[]
  status: 'OPEN' | 'AWAITING_CUSTOMER_DECISION' | 'RESOLVED' | string
  decision?: ApiIncidentDecision | null
  decision_source?: 'CUSTOMER' | 'STAFF_RECORDED' | null
  contact_channel?: 'APP' | ApiIncidentContactChannel | null
  customer_note?: string | null
  new_start_time?: string | null
  continuation_policy?: 'RESUME_REMAINING' | 'RESTART_CURRENT_ITEM' | null
  reported_by_id?: string | null
  resolved_at?: string | null
  compensation_voucher_ids?: string[]
  compensation_vouchers?: Array<{
    id: string
    code: string
    status: string
    expires_at?: string | null
    customer_id?: string | null
    guest_phone?: string | null
    normalized_guest_phone?: string | null
  }>
  created_at?: string
  updated_at?: string
}

/** Voucher bồi thường (compensation) — swagger `CustomerVoucher`. */
export interface ApiCustomerVoucher {
  id: string
  code: string
  source_type?: 'INCIDENT' | 'CUSTOMER_CASE' | 'ADMIN_GIFT' | string | null
  voucher_type: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FREE_SERVICE' | string
  value: number
  max_discount_amount?: number | null
  min_order_amount?: number | null
  service_package_id?: string | null
  status:
    | 'PENDING_APPROVAL'
    | 'ISSUED'
    | 'RESERVED'
    | 'USED'
    | 'EXPIRED'
    | 'REVOKED'
    | string
  expires_at?: string | null
  source_customer_case_id?: string | null
  source_incident_id?: string | null
  source_booking_incident_id?: string | null
  source_booking_id?: string | null
  customer_id?: string | null
  guest_phone?: string | null
  normalized_guest_phone?: string | null
  garage_id?: string | null
  customer?: {
    id: string
    full_name?: string | null
    email?: string | null
    phone?: string | null
  } | null
  garage?: {
    id: string
    name?: string | null
    garage_code?: string | null
  } | null
  service_package?: {
    id: string
    name?: string | null
    service_type?: string | null
    vehicle_type?: string | null
    base_price?: number | null
  } | null
  note?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiBookingListMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiPaginatedBookings {
  data: ApiBooking[]
  meta: ApiBookingListMeta
}

/**
 * BE có thể trả `included_service_ids` dưới 2 dạng (tùy service-package endpoint):
 *  - string[]: danh sách ObjectId thuần
 *  - IncludedServiceDto[]: object { id, name, ... } (combo expanded)
 * FE normalize về string[] để so sánh & render ổn định.
 */
export type IncludedServiceRef = string | IncludedServiceDto

export interface IncludedServiceDto {
  id: string
  name?: string
  vehicle_type?: VehicleType
  service_type?: string
  base_price?: number
  duration_minutes?: number
}

export interface ApiServicePackage {
  id: string
  name: string
  vehicle_type: VehicleType
  service_type: string
  description?: string
  base_price: number
  duration_minutes: number
  wash_bay_duration_minutes?: number | null
  points_earned: number
  requires_wash_bay: boolean
  requires_care_staff?: boolean
  included_service_ids?: IncludedServiceRef[]
  steps_template?: unknown[]
  is_active: boolean
}

export interface ApiBookingServiceStep {
  id: string
  booking_id: string
  step_code: string
  step_name: string
  order: number
  step_type: string
  display_staff_type: string
  assigned_staff_id: string | null
  confirmed_by_staff_id: string | null
  status: string
  instructions: string[]
  started_at: string | null
  completed_at: string | null
}

/**
 * Service workflow response — BE `GET /admin/bookings/:id/service-workflow`.
 * Trả về danh sách item kèm countdown và quyền thao tác theo staff assignment.
 */
export type ApiServiceWorkflowPhase =
  | 'PENDING'
  | 'RUNNING'
  | 'PAUSED'
  | 'INCIDENT_HOLD'
  | 'COMPLETED'

export interface ApiServiceWorkflowItem {
  item_key: string
  step_name: string
  step_code?: string
  step_type?: string
  sequence: number
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'TIMED_OUT' | string
  duration_seconds: number
  started_at: string | null
  ends_at: string | null
  paused_at?: string | null
  remaining_seconds?: number | null
  /** Quyền thao tác mà BE trả về theo staff capability/assignment. */
  controls: {
    can_complete_early: boolean
    can_confirm_complete: boolean
    can_pause: boolean
    can_resume: boolean
  }
  assigned_execution_staff?: ApiBookingAssignedCareStaff | null
}

export interface ApiServiceWorkflow {
  booking_id: string
  status: string
  operation_status?: string | null
  phase: ApiServiceWorkflowPhase
  blocked_by_incident?: boolean
  active_incident_id?: string | null
  items: ApiServiceWorkflowItem[]
  total_duration_seconds?: number | null
}

export interface ApiVehicleInspectionImage {
  image_url: string
  public_id?: string
  caption?: string
}

export interface ApiVehicleInspection {
  id: string
  booking_id: string
  type: 'BEFORE_WASH' | 'AFTER_WASH'
  note: string
  /** BE trả về object[] cho phép caption/public_id, FE đã normalize sang string[] khi map. */
  images: ApiVehicleInspectionImage[] | string[]
  inspected_by: string
  inspected_at: string
}

/** Swagger `markPaidResponse.data` */
export interface ApiMarkPaidResult {
  booking: ApiBooking
  wash_history?: ApiWashHistory | null
  loyalty?: Record<string, unknown> | null
  point_transaction?: Record<string, unknown> | null
  promotion_usage?: Record<string, unknown> | null
  notifications?: Array<Record<string, unknown>>
  already_processed?: boolean
}

/** Swagger `startServiceResponse.data` */
export interface ApiStartServiceResult {
  booking: ApiBooking
  service_steps: ApiBookingServiceStep[]
}

/** Swagger `paymentDetailResponse.data` */
export interface ApiPaymentDetailResult {
  booking: ApiBooking
  payment: ApiPaymentTransaction
}

export interface ApiWashHistoryCustomer {
  id: string
  full_name: string
  email?: string | null
  phone?: string | null
  role?: string
  is_active?: boolean
}

export interface ApiWashHistoryVehicle {
  id: string
  raw_license_plate?: string
  license_plate?: string
  normalized_license_plate?: string
  vehicle_type: VehicleType
  engine_type?: string
  brand?: string | null
  model?: string | null
  color?: string | null
  is_active?: boolean
}

export interface ApiWashHistoryServicePackage {
  id: string
  name: string
  vehicle_type?: VehicleType
  service_type?: string
  base_price?: number
  duration_minutes?: number
  requires_wash_bay?: boolean
  is_active?: boolean
}

export interface ApiWashHistory {
  id: string
  booking_id: string
  booking?: {
    id: string
    booking_date?: string
    start_time?: string
    end_time?: string
    status?: string
    payment_status?: string
  } | null
  customer_id?: string | null
  customer?: ApiWashHistoryCustomer | null
  vehicle_id?: string | null
  vehicle?: ApiWashHistoryVehicle | null
  garage_id: string
  service_package_id: string
  service_package?: ApiWashHistoryServicePackage | null
  vehicle_type?: VehicleType
  amount_paid: number
  original_price?: number
  discount_amount?: number
  points_earned: number
  points_used?: number
  payment_method: 'CASH' | 'PAYOS'
  paid_at: string
  service_started_at?: string | null
  service_completed_at?: string
  created_at?: string
  updated_at?: string
  /** @deprecated Legacy flat fields — prefer nested customer/vehicle/service_package */
  license_plate?: string
  customer_name?: string
  service_package_name?: string
  final_price?: number
  earned_points?: number
  washed_at?: string
}

export interface WalkInBookingApiPayload {
  garage_id: string
  service_package_id: string
  license_plate: string
  vehicle_type: VehicleType
  engine_type: 'GASOLINE' | 'ELECTRIC'
  motorbike_cc_group?: 'UNDER_175CC' | 'OVER_175CC' | null
  car_body_type?: 'HATCHBACK' | 'SEDAN' | 'SUV' | 'MPV' | 'PICKUP' | 'VAN' | null
  seat_count?: number | null
  quote_id?: string
  start_time?: string
  serve_now?: boolean
  suggestion_days?: number
  guest_name?: string | null
  guest_phone?: string | null
  guest_email?: string
  add_on_service_ids?: string[]
  promotion_code?: string
  voucher_code?: string
  note?: string
}

export interface CancelBookingApiPayload {
  reason?: string
}

export interface MarkNoShowApiPayload {
  reason?: string
}

export type LateArrivalResolution =
  | 'ACCEPT_WITHIN_ORIGINAL_WINDOW'
  | 'RESCHEDULED'

export interface ResolveLateArrivalApiPayload {
  resolution: LateArrivalResolution
  new_start_time?: string | null
  reason?: string
  note?: string
}

export interface ApiLateArrivalSuggestedSlot {
  start_time: string
  end_time: string
  wash_bay_start_time?: string | null
  wash_bay_end_time?: string | null
  wash_bay_work_end_time?: string | null
  wash_bay_reserved_until?: string | null
  care_staff_start_time?: string | null
  care_staff_end_time?: string | null
  care_staff_work_end_time?: string | null
  care_staff_reserved_until?: string | null
  is_available: boolean
  unavailable_reasons?: Array<
    | 'VEHICLE_BOOKING_OVERLAP'
    | 'WASH_BAY_CAPACITY_FULL'
    | 'CARE_STAFF_CAPACITY_FULL'
    | string
  >
  available_capacity?: number | null
  available_wash_bay_capacity?: number | null
  available_care_staff_capacity?: number | null
  booking_items?: ApiBookingItem[]
}

export interface ApiLateArrivalOptions {
  booking_id: string
  arrival_status: 'LATE'
  arrived_at: string
  arrival_reference_start_time: string
  late_minutes: number
  grace_exceeded_minutes: number
  search_start_time: string
  suggested_slots: ApiLateArrivalSuggestedSlot[]
}

/**
 * Cấu trúc 1 ảnh đính kèm inspection gửi lên BE.
 * BE schema (`vehicleInspection.validator.js`) yêu cầu `images` là mảng object
 * với `image_url` bắt buộc; `public_id` / `caption` optional. Trước đây FE
 * gửi mảng string nên BE Zod ném "Invalid input: expected object, received string".
 */
export interface CreateInspectionApiImage {
  image_url: string
  public_id?: string | null
  caption?: string | null
}

export interface CreateInspectionApiPayload {
  type: 'BEFORE_WASH' | 'AFTER_WASH'
  note?: string | null
  images: CreateInspectionApiImage[]
}

export interface UploadApiResponse {
  id: string
  url: string
  public_id?: string
  mime_type?: string
  size?: number
  purpose?: string
  owner_id?: string
  related_type?: string | null
  related_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiWashBay {
  id: string
  garage_id: string
  name: string
  bay_code: string
  vehicle_type: VehicleType
  status: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'INACTIVE'
  current_booking_id?: string | null
  is_active: boolean
}

export interface ApiPaymentTransaction {
  id: string
  booking_id: string
  provider: 'PAYOS'
  method: 'QR'
  order_code: number
  payment_link_id: string
  checkout_url: string
  qr_code?: string
  amount: number
  currency: 'VND'
  description?: string
  status:
    | 'INITIATED'
    | 'PENDING'
    | 'CANCELING'
    | 'PAID'
    | 'CANCELED'
    | 'EXPIRED'
    | 'FAILED'
  paid_at?: string | null
  expires_at?: string | null
  canceled_at?: string | null
  expired_at?: string | null
  created_by_staff_id?: string | null
  created_at: string
  updated_at: string
  /** BE bổ sung: metadata về bên khởi tạo payment (staff-api-changes.md + payment workflow docs). */
  initiator?: {
    actor_type: 'CUSTOMER' | 'STAFF' | 'ADMIN' | 'WEBHOOK' | 'SYSTEM' | string
    actor_id?: string | null
    actor_name?: string | null
    initiated_at?: string
    source?: 'STAFF_PORTAL' | 'CUSTOMER_APP' | 'ADMIN_PORTAL' | string
  } | null
  /** Audit cho terminal/failure paths — BE không ghi đè transaction đã terminal. */
  audit?: Array<{
    event: 'CONFIRMED' | 'FAILED' | 'CANCELED' | 'EXPIRED' | string
    at: string
    by?: string | null
    note?: string | null
  }>
}

export interface ApiStaffCustomerVehicle {
  id: string
  /** Swagger AdminCustomerVehicleSuggestion */
  license_plate?: string | null
  raw_license_plate?: string
  normalized_license_plate?: string
  vehicle_type: VehicleType
  brand?: string | null
  model?: string | null
  color?: string | null
}

export interface ApiStaffCustomer {
  customer_id: string
  full_name: string
  phone: string
  email?: string | null
  vehicles: ApiStaffCustomerVehicle[]
  last_booking_at?: string | null
  total_bookings_at_garage?: number
}

// ============================================================
// Service Workflow — BE PATCH /admin/bookings/:id/service-items/:itemKey/*
// ============================================================

export interface ApiServiceWorkflowItemPayload {
  /** ISO 8601 local time. Chỉ cần với pause/resume trong một số trường hợp. */
  note?: string
}

export type ApiServiceWorkflowItemResponse = ApiServiceWorkflow

// ============================================================
// Booking Incident — BE POST /admin/bookings/:id/incidents
// ============================================================

export type ApiBookingIncidentType =
  | 'WASH_BAY_FAILURE'
  | 'STAFF_UNAVAILABLE'
  | 'OTHER_GARAGE_INCIDENT'

export type ApiIncidentDecision =
  | 'REASSIGN_AND_CONTINUE'
  | 'RESCHEDULE_NEAREST'
  | 'RESCHEDULE_CUSTOM'
  | 'CANCEL_BY_GARAGE'

export type ApiIncidentContactChannel = 'PHONE' | 'IN_PERSON'

export interface ApiReportBookingIncidentPayload {
  incident_type: ApiBookingIncidentType
  /** Bắt buộc khi incident_type = OTHER_GARAGE_INCIDENT (BE validate). */
  description?: string
  affected_booking_item_key?: string
  affected_wash_bay_id?: string
  affected_staff_profile_id?: string
}

export interface ApiBookingIncidentActive {
  incident: ApiBookingIncident
  resolution_options: ApiIncidentResolutionOptions
}

export interface ApiIncidentResolutionOptions {
  booking_id: string
  incident_id: string
  incident_type: ApiBookingIncidentType
  operation_status: string
  can_reassign_and_continue: boolean
  available_actions: ApiIncidentDecision[]
  search_start_time: string
  /** Slot gợi ý cho RESCHEDULE_NEAREST/RESCHEDULE_CUSTOM. */
  suggested_slots?: Array<ApiLateArrivalSuggestedSlot>
  /** Buồng rửa/staff đề xuất cho REASSIGN_AND_CONTINUE. */
  reassignment_candidates?: {
    wash_bays?: Array<{ id: string; name: string; bay_code: string }>
    care_staff?: Array<{ staff_profile_id: string; full_name: string }>
  }
}

export interface ApiRecordCustomerDecisionPayload {
  decision: ApiIncidentDecision
  /** Bắt buộc khi decision = RESCHEDULE_CUSTOM. */
  new_start_time?: string
  continuation_policy?: 'RESUME_REMAINING' | 'RESTART_CURRENT_ITEM'
  customer_note?: string
  /** Bắt buộc khi staff ghi nhận thay: 'PHONE' | 'IN_PERSON'. */
  contact_channel?: ApiIncidentContactChannel
}

export type ApiCompensationVoucherType =
  | 'FIXED_AMOUNT'
  | 'PERCENTAGE'
  | 'FREE_SERVICE'

export interface ApiIssueCompensationVoucherPayload {
  voucher_type: ApiCompensationVoucherType
  /** Số tiền hoặc phần trăm; FREE_SERVICE thì value = 0. */
  value: number
  min_order_amount?: number
  /** Chỉ áp dụng cho PERCENTAGE. */
  max_discount_amount?: number
  expires_at: string
  /** Bắt buộc khi voucher_type = FREE_SERVICE. */
  service_package_id?: string
  note?: string
}
