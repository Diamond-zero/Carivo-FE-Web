import type { ApiResponse } from '../types/api'
import type {
  ApiListResponse,
  ApiPromotion,
  ApiPromotionAudience,
} from '../types/api/admin'
import type { LoyaltyTier } from '../types/loyalty'
import type { PromotionAudience } from '../types/promotion'
import type { VehicleType } from '../types/washBay'
import { apiClient } from './client'

export interface PromotionListParams {
  page?: number
  limit?: number
  search?: string
  vehicle_type?: VehicleType
  tier?: LoyaltyTier
  audience?: ApiPromotionAudience
  is_active?: boolean
  valid_only?: boolean
}

export interface PromotionListResult {
  promotions: ApiPromotion[]
  meta?: ApiListResponse<ApiPromotion[]>['meta']
}

export interface PromotionCreatePayload {
  code: string
  name: string
  description?: string | null
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: number
  max_discount_amount?: number | null
  min_order_amount?: number
  audience?: PromotionAudience
  phone_required?: boolean
  per_phone_limit?: number | null
  applicable_tiers?: LoyaltyTier[]
  applicable_vehicle_types?: VehicleType[]
  applicable_service_package_ids?: string[]
  start_at: string
  end_at: string
  usage_limit?: number | null
  per_customer_limit?: number | null
  is_active?: boolean
}

export type PromotionUpdatePayload = Partial<PromotionCreatePayload>

export async function getAdminPromotionsApi(
  params?: PromotionListParams,
): Promise<PromotionListResult> {
  const { data } = await apiClient.get<ApiListResponse<ApiPromotion[]>>(
    '/admin/promotions',
    { params },
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

export async function deleteAdminPromotionApi(promotionId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiPromotion>>(
    `/admin/promotions/${promotionId}`,
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