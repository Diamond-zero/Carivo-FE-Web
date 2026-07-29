import type { ApiResponse } from '../types/api'
import type { ApiListResponse, ApiPaginationMeta, ApiWaitlist } from '../types/api/admin'
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

export interface AdminWaitlistsResult {
  waitlists: ApiWaitlist[]
  meta: ApiPaginationMeta
}

export async function getAdminWaitlistsApi(
  params?: WaitlistListParams,
): Promise<AdminWaitlistsResult> {
  const { data } = await apiClient.get<ApiListResponse<ApiWaitlist[]>>(
    '/admin/waitlists',
    { params },
  )
  return {
    waitlists: data.data,
    meta: data.meta ?? {
      page: params?.page ?? 1,
      limit: params?.limit ?? data.data.length,
      total: data.data.length,
      total_pages: 1,
    },
  }
}

export async function cancelAdminWaitlistApi(waitlistId: string, reason?: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiWaitlist>>(
    `/admin/waitlists/${waitlistId}/cancel`,
    { reason: reason ?? '' },
  )
  return data.data
}

export interface OfferAdminWaitlistPayload {
  waitlistId: string
  offerExpiresInMinutes?: number
}

export async function offerAdminWaitlistApi({
  waitlistId,
  offerExpiresInMinutes,
}: OfferAdminWaitlistPayload) {
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
