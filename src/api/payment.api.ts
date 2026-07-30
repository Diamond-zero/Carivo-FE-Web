import type { ApiResponse } from '../types/api'
import type {
  ApiBooking,
  ApiPaymentDetailResult,
  ApiPaymentTransaction,
} from '../types/api/staff'
import { markBookingPaidApi } from './booking.api'
import { apiClient } from './client'

export interface CreatePayosPaymentPayload {
  return_url?: string
  cancel_url?: string
}

export interface CancelPaymentPayload {
  reason?: string
}

export interface CreatePayosPaymentResult {
  booking?: ApiBooking
  payment: ApiPaymentTransaction
  reused?: boolean
}

export interface PollingPayosPaymentResult {
  booking?: ApiBooking
  payment: ApiPaymentTransaction | null
  /** Người khởi tạo payment. BE trả null nếu payment không active. */
  initiator?: ApiPaymentTransaction['initiator']
}

export async function createPayosPaymentApi(
  bookingId: string,
  payload?: CreatePayosPaymentPayload,
) {
  const { data } = await apiClient.post<ApiResponse<CreatePayosPaymentResult>>(
    `/admin/payments/bookings/${bookingId}/payos`,
    payload ?? {},
  )
  return data.data
}

export async function markBookingPaidWithCashApi(
  bookingId: string,
  note?: string,
) {
  const result = await markBookingPaidApi(bookingId, note)
  return result.booking
}

export async function getPaymentApi(paymentId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiPaymentDetailResult>>(
    `/admin/payments/${paymentId}`,
  )
  return data.data
}

export async function cancelPaymentApi(
  paymentId: string,
  payload?: CancelPaymentPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiPaymentDetailResult>>(
    `/admin/payments/${paymentId}/cancel`,
    payload ?? {},
  )
  return data.data
}

export async function expirePaymentApi(paymentId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiPaymentDetailResult>>(
    `/admin/payments/${paymentId}/expire`,
    {},
  )
  return data.data
}

// ============================================================================
// Polling — BE payment workflow docs (payment-by-role mục "API mới / thay đổi"):
//   GET /api/v1/admin/payments/bookings/:bookingId/payos  — staff/admin polling
//   GET /api/v1/payments/bookings/:bookingId/payos        — customer polling
// Mỗi bên đều trả về payment active (nếu có). FE customer/admin dùng chung
// helper này + truyền `endpoint` tương ứng.
// ============================================================================

export async function pollBookingPayosPaymentApi(
  bookingId: string,
  role: 'CUSTOMER' | 'STAFF',
) {
  const base = role === 'CUSTOMER' ? '/payments' : '/admin/payments'
  const { data } = await apiClient.get<ApiResponse<PollingPayosPaymentResult>>(
    `${base}/bookings/${bookingId}/payos`,
  )
  return data.data
}
