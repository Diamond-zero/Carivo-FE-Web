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

export interface ApiBookingAssignedCareStaff {
  staff_profile_id?: string
  staff_profile?: Record<string, unknown>
  user_id?: string
  user?: Record<string, unknown>
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
  assigned_care_staff?: ApiBookingAssignedCareStaff[]
  original_price: number
  promotion_discount_amount?: number
  points_discount_amount?: number
  discount_amount: number
  final_price: number
  payment_method: 'CASH' | 'PAYOS'
  payment_status: 'UNPAID' | 'PENDING' | 'PAID'
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
  note: string | null
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
  included_service_ids?: string[]
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

export interface ApiVehicleInspection {
  id: string
  booking_id: string
  type: 'BEFORE_WASH' | 'AFTER_WASH'
  note: string
  images: string[]
  inspected_by: string
  inspected_at: string
}

export interface ApiWashHistory {
  id: string
  booking_id: string
  garage_id: string
  license_plate: string
  service_package_id: string
  service_package_name?: string
  customer_name: string
  final_price: number
  payment_method: string
  washed_at: string
  earned_points: number
}

export interface WalkInBookingApiPayload {
  garage_id: string
  service_package_id: string
  license_plate: string
  vehicle_type: VehicleType
  start_time?: string
  serve_now?: boolean
  suggestion_days?: number
  guest_name?: string | null
  guest_phone?: string | null
  guest_email?: string
  add_on_service_ids?: string[]
  promotion_code?: string
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

export interface CreateInspectionApiPayload {
  type: 'BEFORE_WASH' | 'AFTER_WASH'
  note: string
  images: string[]
}

export interface UploadApiResponse {
  id: string
  url: string
  public_id?: string
}
