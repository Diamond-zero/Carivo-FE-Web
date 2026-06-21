import type { ApiResponse } from '../types/api'
import type { ApiPaymentTransaction } from '../types/api/staff'
import { apiClient } from './client'

export interface CreatePayosPaymentPayload {
  return_url?: string
  cancel_url?: string
}

export interface CancelPaymentPayload {
  reason?: string
}

export async function createPayosPaymentApi(
  bookingId: string,
  payload?: CreatePayosPaymentPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPaymentTransaction>>(
    `/admin/payments/bookings/${bookingId}/payos`,
    payload ?? {},
  )
  return data.data
}

export async function getPaymentApi(paymentId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiPaymentTransaction>>(
    `/admin/payments/${paymentId}`,
  )
  return data.data
}

export async function cancelPaymentApi(
  paymentId: string,
  payload?: CancelPaymentPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiPaymentTransaction>>(
    `/admin/payments/${paymentId}/cancel`,
    payload ?? {},
  )
  return data.data
}

export async function expirePaymentApi(paymentId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiPaymentTransaction>>(
    `/admin/payments/${paymentId}/expire`,
    {},
  )
  return data.data
}
