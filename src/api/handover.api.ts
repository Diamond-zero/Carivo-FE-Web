import type { ApiResponse } from '../types/api'
import { apiClient } from './client'

// ============================================================================
// Vehicle handover operations — Swagger [STAFF, ADMIN] Vehicle handover
// ============================================================================

export type HandoverStatus =
  | 'NOT_STARTED'
  | 'READY_FOR_HANDOVER'
  | 'AWAITING_CUSTOMER_RESPONSE'
  | 'COMPLETED'
  | 'DISPUTED'
  | string

export interface ApiBookingHandoverEvent {
  id: string
  type: string
  actor_id?: string | null
  note?: string | null
  created_at?: string
}

export interface ApiBookingHandover {
  booking_id: string
  status: HandoverStatus
  ready_at?: string | null
  customer_response_at?: string | null
  released_at?: string | null
  customer_signature_url?: string | null
  staff_notes?: string | null
  events: ApiBookingHandoverEvent[]
}

export interface ReadyHandoverPayload {
  note?: string
}

export interface ReleaseHandoverPayload {
  customer_response: 'ACCEPTED' | 'DISPUTED'
  customer_signature_url?: string
  note?: string
}

export async function getBookingHandoverApi(bookingId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiBookingHandover>>(
    `/admin/bookings/${bookingId}/handover`,
  )
  return data.data
}

export async function readyBookingHandoverApi(
  bookingId: string,
  payload: ReadyHandoverPayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBookingHandover>>(
    `/admin/bookings/${bookingId}/handover/ready`,
    payload,
  )
  return data.data
}

export async function releaseBookingHandoverApi(
  bookingId: string,
  payload: ReleaseHandoverPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiBookingHandover>>(
    `/admin/bookings/${bookingId}/handover/release`,
    payload,
  )
  return data.data
}

export const HANDOVER_STATUS_LABELS: Record<HandoverStatus, string> = {
  NOT_STARTED: 'Chưa bắt đầu',
  READY_FOR_HANDOVER: 'Sẵn sàng bàn giao',
  AWAITING_CUSTOMER_RESPONSE: 'Chờ khách phản hồi',
  COMPLETED: 'Hoàn tất',
  DISPUTED: 'Có tranh chấp',
}

export const HANDOVER_STATUS_VARIANT: Record<
  HandoverStatus,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  NOT_STARTED: 'default',
  READY_FOR_HANDOVER: 'info',
  AWAITING_CUSTOMER_RESPONSE: 'warning',
  COMPLETED: 'success',
  DISPUTED: 'danger',
}