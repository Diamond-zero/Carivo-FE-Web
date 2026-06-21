import type { ApiResponse } from '../types/api'
import type { ApiListResponse, ApiWaitlist } from '../types/api/admin'
import { apiClient } from './client'

export interface WaitlistListParams {
  page?: number
  limit?: number
  status?: 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'CANCELED' | 'EXPIRED'
  customer_id?: string
  vehicle_id?: string
  garage_id?: string
  service_package_id?: string
  vehicle_type?: 'MOTORBIKE' | 'CAR'
  from?: string
  to?: string
}

export async function getAdminWaitlistsApi(params?: WaitlistListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiWaitlist[]>>('/admin/waitlists', {
    params: { limit: 100, ...params },
  })
  return { waitlists: data.data, meta: data.meta }
}

export async function cancelAdminWaitlistApi(waitlistId: string, note?: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiWaitlist>>(
    `/admin/waitlists/${waitlistId}/cancel`,
    { note: note ?? '' },
  )
  return data.data
}

export async function offerAdminWaitlistApi(
  waitlistId: string,
  offerExpiresInMinutes = 15,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiWaitlist>>(
    `/admin/waitlists/${waitlistId}/offer`,
    { offer_expires_in_minutes: offerExpiresInMinutes },
  )
  return data.data
}

export async function expireAdminWaitlistApi(waitlistId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiWaitlist>>(
    `/admin/waitlists/${waitlistId}/expire`,
  )
  return data.data
}
