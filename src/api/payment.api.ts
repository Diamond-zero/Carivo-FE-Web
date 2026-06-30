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
