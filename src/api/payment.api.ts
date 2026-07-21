import axios from 'axios'
import type { ApiResponse } from '../types/api'
import type {
  ApiBooking,
  ApiPaymentDetailResult,
  ApiPaymentTransaction,
} from '../types/api/staff'
import { markBookingPaidApi } from './booking.api'
import { apiClient, getApiErrorCode } from './client'

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
  booking_id: string
  payment: ApiPaymentTransaction | null
  has_active_payment: boolean
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
  try {
    const result = await markBookingPaidApi(bookingId, note)
    return result.booking
  } catch (error) {
    if (
      !axios.isAxiosError(error) ||
      getApiErrorCode(error) !== 'BOOKING_PENDING_PAYOS_PAYMENT'
    ) {
      throw error
    }

    // BE payment workflow docs: khi staff muốn thu tiền mặt, BE đang giữ
    // payment PayOS pending — staff hủy payment đó trước rồi mới mark-paid.
    // Xem docs BE "Payment transaction lock" + payment.api.ts:44-58 (cũ).
    const { payment } = await createPayosPaymentApi(bookingId)
    await cancelPaymentApi(payment.id, {
      reason: note?.trim() || 'Staff confirmed cash payment',
    })
    const result = await markBookingPaidApi(bookingId, note)
    return result.booking
  }
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
