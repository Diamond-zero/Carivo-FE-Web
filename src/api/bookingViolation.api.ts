import { apiClient } from './client'
import type {
  BookingViolationAppeal,
  BookingViolationAppealListParams,
  BookingViolationDetail,
  BookingViolationListParams,
  BookingViolationStatus,
  PaginationMeta,
} from '../types/bookingViolation'

interface ListResponse<T> {
  success: boolean
  message: string
  data: T[]
  meta: PaginationMeta
}

interface DetailResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function getAdminBookingViolationsApi(
  params?: BookingViolationListParams,
) {
  const { data } = await apiClient.get<ListResponse<BookingViolationStatus>>(
    '/admin/booking-violations',
    { params },
  )
  return { items: data.data, meta: data.meta }
}

export async function getAdminBookingViolationDetailApi(
  customerId: string,
) {
  const { data } = await apiClient.get<DetailResponse<BookingViolationDetail>>(
    `/admin/booking-violations/${customerId}`,
    { params: { page: 1, limit: 100 } },
  )
  return data.data
}

export async function adjustAdminBookingViolationScoreApi(
  customerId: string,
  payload: { score_change: number; reason: string },
) {
  const { data } = await apiClient.post<
    DetailResponse<{
      status: BookingViolationStatus
      adjustment: unknown
    }>
  >(`/admin/booking-violations/${customerId}/adjustments`, payload)
  return data.data
}

export async function getAdminBookingViolationAppealsApi(
  params?: BookingViolationAppealListParams,
) {
  const { data } = await apiClient.get<ListResponse<BookingViolationAppeal>>(
    '/admin/booking-violations/appeals',
    { params },
  )
  return { items: data.data, meta: data.meta }
}

export async function reviewAdminBookingViolationAppealApi(
  appealId: string,
  payload: {
    status: 'APPROVED' | 'REJECTED'
    admin_note: string
  },
) {
  const { data } = await apiClient.patch<DetailResponse<BookingViolationAppeal>>(
    `/admin/booking-violations/appeals/${appealId}`,
    payload,
  )
  return data.data
}
