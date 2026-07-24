import type { ApiResponse } from '../types/api'
import { apiClient } from './client'

// ============================================================================
// Vehicle handover — theo BE (BE/WDP301-Project/backend/src/modules/booking-handovers/)
//
// Route mount (xem `BE/src/routes/index.js`):
//   /staff/bookings/:id/handover        (GET/PATCH)        — staff + admin
//   /staff/bookings/:id/handover/ready  (PATCH)            — markReady
//   /staff/bookings/:id/handover/walk-in-accept (PATCH)   — acceptWalkInHandover
//   /staff/bookings/:id/handover/release (PATCH)          — release vehicle
//
// Capability: BOOKING_HANDOVER_MANAGE_GARAGE (= `booking_handover.manage_garage`).
// ============================================================================

/** Handover state trên BE `BOOKING_HANDOVER_STATES`. */
export type HandoverState =
  | 'PENDING'
  | 'READY_FOR_CUSTOMER'
  | 'ON_HOLD'
  | 'RELEASED'

/** Customer response state trên BE `BOOKING_HANDOVER_RESPONSES`. */
export type HandoverCustomerResponse =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ISSUE_REPORTED'

/** Source ghi nhận phản hồi khách — `BOOKING_HANDOVER_RESPONSE_SOURCES`. */
export type HandoverResponseSource = 'CUSTOMER_SELF_SERVICE' | 'STAFF_ASSISTED'

/** DTO trả về từ các endpoint handover (BE `BookingHandoverDTO`). */
export interface ApiBookingHandover {
  id: string
  booking_id: string
  garage_id: string
  customer_id: string | null
  vehicle_id: string | null
  guest_name: string | null
  guest_phone: string | null
  state: HandoverState
  customer_response: HandoverCustomerResponse
  ready_at: string | null
  ready_by_id: string | null
  ready_by?: { id: string; full_name: string; role: string } | null
  ready_note?: string | null
  customer_responded_at: string | null
  customer_response_source: HandoverResponseSource | null
  customer_response_recorded_by_id?: string | null
  customer_response_recorded_by?: {
    id: string
    full_name: string
    role: string
  } | null
  customer_response_note?: string | null
  accepted_at: string | null
  released_at: string | null
  released_by_id: string | null
  released_by?: { id: string; full_name: string; role: string } | null
  release_note?: string | null
  issue_case_ids?: string[]
  inspection_snapshot?: unknown | null
  created_at?: string
  updated_at?: string
}

/** Payload cho `markReady` (BE `/staff/bookings/:id/handover/ready`). */
export interface ReadyHandoverPayload {
  note?: string
}

/** Payload cho `acceptWalkInHandover` (BE `/staff/bookings/:id/handover/walk-in-accept`). */
export interface WalkInAcceptHandoverPayload {
  note?: string
}

/** Payload cho `release` (BE `/staff/bookings/:id/handover/release`). */
export interface ReleaseHandoverPayload {
  note?: string
}

/** Lấy handover của một booking (staff view). */
export async function getStaffBookingHandoverApi(bookingId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiBookingHandover>>(
    `/staff/bookings/${bookingId}/handover`,
  )
  return data.data
}

/** Bước 1: chuẩn bị bàn giao — `READY_FOR_CUSTOMER + PENDING`. */
export async function readyBookingHandoverApi(
  bookingId: string,
  payload: ReadyHandoverPayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBookingHandover>>(
    `/staff/bookings/${bookingId}/handover/ready`,
    payload,
  )
  return data.data
}

/** Bước 2 (walk-in): staff ghi nhận khách vãng lai đã xác nhận tình trạng xe. */
export async function walkInAcceptHandoverApi(
  bookingId: string,
  payload: WalkInAcceptHandoverPayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBookingHandover>>(
    `/staff/bookings/${bookingId}/handover/walk-in-accept`,
    payload,
  )
  return data.data
}

/** Bước cuối: bàn giao xe (release) — yêu cầu customer_response = ACCEPTED + payment PAID|WAIVED. */
export async function releaseBookingHandoverApi(
  bookingId: string,
  payload: ReleaseHandoverPayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBookingHandover>>(
    `/staff/bookings/${bookingId}/handover/release`,
    payload,
  )
  return data.data
}

// ============================================================================
// Backward-compat aliases — các file cũ đã import những tên này. Không dùng
// cho code mới; giữ để tránh vỡ import ngay lập tức.
// ============================================================================

/** @deprecated Use `HandoverState` + `HandoverCustomerResponse` thay cho enum cũ. */
export type HandoverStatus = HandoverState | string
/** @deprecated dùng `getStaffBookingHandoverApi`. */
export const getBookingHandoverApi = getStaffBookingHandoverApi

/** Label cho handover state — dùng cho badge ở staff portal. */
export const HANDOVER_STATE_LABELS: Record<HandoverState, string> = {
  PENDING: 'Chưa bắt đầu',
  READY_FOR_CUSTOMER: 'Sẵn sàng cho khách kiểm tra',
  ON_HOLD: 'Tạm dừng (đang xử lý sự cố)',
  RELEASED: 'Đã bàn giao xe',
}

/** Label cho customer response — dùng cho badge phụ. */
export const HANDOVER_RESPONSE_LABELS: Record<HandoverCustomerResponse, string> = {
  PENDING: 'Đang chờ khách',
  ACCEPTED: 'Khách đã đồng ý tình trạng xe',
  ISSUE_REPORTED: 'Khách báo có vấn đề',
}

/** Variant màu cho badge trạng thái. */
export const HANDOVER_STATE_VARIANT: Record<
  HandoverState,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  PENDING: 'default',
  READY_FOR_CUSTOMER: 'info',
  ON_HOLD: 'warning',
  RELEASED: 'success',
}
