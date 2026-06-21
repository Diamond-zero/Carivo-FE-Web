import type { ApiResponse } from '../types/api'
import type { ApiTierRule } from '../types/api/admin'
import { apiClient } from './client'

export interface TierRuleUpdatePayload {
  booking_window_days?: number
  max_upcoming_bookings?: number
  point_multiplier?: number
  priority_level?: number
  min_total_spent?: number
  min_total_visits?: number
  min_total_points?: number
  is_active?: boolean
}

export async function getAdminTierRulesApi() {
  const { data } = await apiClient.get<ApiResponse<ApiTierRule[]>>(
    '/admin/loyalty/tier-rules',
  )
  return data.data
}

export async function updateAdminTierRuleApi(
  tierRuleId: string,
  payload: TierRuleUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiTierRule>>(
    `/admin/loyalty/tier-rules/${tierRuleId}`,
    payload,
  )
  return data.data
}

export async function activateAdminTierRuleApi(tierRuleId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiTierRule>>(
    `/admin/loyalty/tier-rules/${tierRuleId}/activate`,
  )
  return data.data
}

export async function deactivateAdminTierRuleApi(tierRuleId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiTierRule>>(
    `/admin/loyalty/tier-rules/${tierRuleId}/deactivate`,
  )
  return data.data
}

export interface LoyaltyCustomerListParams {
  page?: number
  limit?: number
  search?: string
  tier?: string
}

export async function getAdminLoyaltyCustomersApi(
  params?: LoyaltyCustomerListParams,
) {
  const { data } = await apiClient.get<
    import('../types/api/admin').ApiListResponse<
      import('../types/api/admin').ApiLoyaltyCustomer[]
    >
  >('/admin/loyalty/customers', { params: { limit: 100, ...params } })
  return { customers: data.data, meta: data.meta }
}

export async function getAdminLoyaltyCustomerByIdApi(customerId: string) {
  const { data } = await apiClient.get<
    ApiResponse<import('../types/api/admin').ApiLoyaltyCustomerDetail>
  >(`/admin/loyalty/customers/${customerId}`)
  return data.data
}

export async function getAdminLoyaltyTransactionsApi(
  customerId: string,
  params?: { page?: number; limit?: number },
) {
  const { data } = await apiClient.get<
    import('../types/api/admin').ApiListResponse<Array<Record<string, unknown>>>
  >(`/admin/loyalty/customers/${customerId}/transactions`, { params })
  return { transactions: data.data, meta: data.meta }
}

export interface ExpiringPointsParams {
  page?: number
  limit?: number
  customer_id?: string
  days?: number
}

export async function getAdminExpiringPointsApi(params?: ExpiringPointsParams) {
  const { data } = await apiClient.get<
    import('../types/api/admin').ApiListResponse<
      import('../types/api/admin').ApiExpiringPoint[]
    >
  >('/admin/loyalty/expiring-points', { params: { limit: 100, days: 30, ...params } })
  return { items: data.data, meta: data.meta }
}

export async function expireAdminLoyaltyPointsApi() {
  const { data } = await apiClient.post<ApiResponse<{ expired_count?: number }>>(
    '/admin/loyalty/expire-points',
  )
  return data.data
}

export async function getAdminLoyaltyTransactionsListApi(params?: {
  page?: number
  limit?: number
  customer_id?: string
  type?: string
}) {
  const { data } = await apiClient.get<
    import('../types/api/admin').ApiListResponse<Array<Record<string, unknown>>>
  >('/admin/loyalty/transactions', { params: { limit: 100, ...params } })
  return { transactions: data.data, meta: data.meta }
}

export async function createAdminTierRuleApi(payload: {
  tier_name: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  booking_window_days: number
  max_upcoming_bookings: number
  point_multiplier: number
  priority_level: number
  min_total_spent?: number
  min_total_visits?: number
  min_total_points?: number
  is_active?: boolean
}) {
  const { data } = await apiClient.post<ApiResponse<ApiTierRule>>(
    '/admin/loyalty/tier-rules',
    payload,
  )
  return data.data
}
