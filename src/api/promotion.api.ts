import type { ApiResponse } from '../types/api'
import type { ApiListResponse, ApiPromotion } from '../types/api/admin'
import { apiClient } from './client'

export interface PromotionListParams {
  page?: number
  limit?: number
  search?: string
  vehicle_type?: string
  tier?: string
  audience?: string
  is_active?: boolean
  valid_only?: boolean
}

export type PromotionCreatePayload = Omit<
  ApiPromotion,
  'id' | 'used_count' | 'reserved_count' | 'created_at' | 'updated_at'
>
export type PromotionUpdatePayload = Partial<PromotionCreatePayload>

export async function getAdminPromotionsApi(params?: PromotionListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiPromotion[]>>(
    '/admin/promotions',
    { params: { limit: 100, ...params } },
  )
  return { promotions: data.data, meta: data.meta }
}

export async function getAdminPromotionByIdApi(promotionId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiPromotion>>(
    `/admin/promotions/${promotionId}`,
  )
  return data.data
}

export async function createAdminPromotionApi(payload: PromotionCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiPromotion>>(
    '/admin/promotions',
    payload,
  )
  return data.data
}

export async function updateAdminPromotionApi(
  promotionId: string,
  payload: PromotionUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiPromotion>>(
    `/admin/promotions/${promotionId}`,
    payload,
  )
  return data.data
}

export async function activateAdminPromotionApi(promotionId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiPromotion>>(
    `/admin/promotions/${promotionId}/activate`,
  )
  return data.data
}

export async function deactivateAdminPromotionApi(promotionId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiPromotion>>(
    `/admin/promotions/${promotionId}/deactivate`,
  )
  return data.data
}
