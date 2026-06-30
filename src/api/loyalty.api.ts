import type { ApiResponse } from '../types/api'
import type {
  ApiLoyaltyCustomer,
  ApiLoyaltyCustomerDetail,
  ApiPointTransaction,
  ApiTierRule,
  ApiExpiringPoint,
} from '../types/api/admin'
import type { ApiListResponse } from '../types/api/admin'
import { apiClient } from './client'

export interface TierRuleCreatePayload {
  tier_name: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  booking_window_days: number
  max_upcoming_bookings: number
  point_multiplier: number
  priority_level: number
  min_total_spent?: number
  min_total_visits?: number
  min_total_points?: number
  is_active?: boolean
}

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

export async function getAdminTierRuleByIdApi(tierRuleId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiTierRule>>(
    `/admin/loyalty/tier-rules/${tierRuleId}`,
  )
  return data.data
}

export async function createAdminTierRuleApi(payload: TierRuleCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiTierRule>>(
    '/admin/loyalty/tier-rules',
    payload,
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

export async function deleteAdminTierRuleApi(tierRuleId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiTierRule>>(
    `/admin/loyalty/tier-rules/${tierRuleId}`,
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
  tier?: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
}

export async function getAdminLoyaltyCustomersApi(
  params?: LoyaltyCustomerListParams,
) {
  const { data } = await apiClient.get<ApiListResponse<ApiLoyaltyCustomer[]>>(
    '/admin/loyalty/customers',
    { params: { limit: 100, ...params } },
  )
  return { customers: data.data, meta: data.meta }
}

export async function getAdminLoyaltyCustomerByIdApi(customerId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiLoyaltyCustomerDetail>>(
    `/admin/loyalty/customers/${customerId}`,
  )
  return data.data
}

export interface LoyaltyTransactionsParams {
  page?: number
  limit?: number
  customer_id?: string
  booking_id?: string
  type?: ApiPointTransaction['type']
}

export async function getAdminLoyaltyTransactionsApi(
  customerId: string,
  params?: LoyaltyTransactionsParams,
) {
  const { data } = await apiClient.get<ApiListResponse<ApiPointTransaction[]>>(
    `/admin/loyalty/customers/${customerId}/transactions`,
    { params },
  )
  return { transactions: data.data, meta: data.meta }
}

export interface ExpiringPointsParams {
  page?: number
  limit?: number
  customer_id?: string
  days?: number
}

export async function getAdminExpiringPointsApi(params?: ExpiringPointsParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiExpiringPoint[]>>(
    '/admin/loyalty/expiring-points',
    { params: { limit: 100, days: 30, ...params } },
  )
  return { items: data.data, meta: data.meta }
}

export interface ExpirePointsPayload {
  customer_id?: string
}

export interface ExpirePointsResult {
  expired_points: number
  customers_processed: number
  source_transactions_processed: number
  checked_at: string
  expire_transactions: ApiPointTransaction[]
}

export async function expireAdminLoyaltyPointsApi(
  payload?: ExpirePointsPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ExpirePointsResult>>(
    '/admin/loyalty/expire-points',
    payload ?? {},
  )
  return data.data
}

export async function getAdminLoyaltyTransactionsListApi(
  params?: LoyaltyTransactionsParams,
) {
  const { data } = await apiClient.get<ApiListResponse<ApiPointTransaction[]>>(
    '/admin/loyalty/transactions',
    { params: { limit: 100, ...params } },
  )
  return { transactions: data.data, meta: data.meta }
}

export async function getMyLoyaltyOverviewApi() {
  const { data } = await apiClient.get<ApiResponse<{
    loyalty: ApiLoyaltyCustomer
    current_tier_rule?: ApiTierRule | null
    next_tier_rule?: ApiTierRule | null
  }>>('/loyalty/me')
  return data.data
}

export async function getMyLoyaltyTransactionsApi(params?: LoyaltyTransactionsParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiPointTransaction[]>>(
    '/loyalty/me/transactions',
    { params },
  )
  return { transactions: data.data, meta: data.meta }
}

export interface RedeemPreviewPayload {
  service_package_id: string
  promotion_id?: string | null
  promotion_code?: string | null
  used_points: number
}

export interface RedeemPreviewResult {
  service_package_id: string
  promotion_id?: string | null
  promotion_code?: string | null
  original_price: number
  promotion_discount_amount: number
  price_after_promotion: number
  available_points: number
  used_points: number
  point_value_amount: number
  points_discount_amount: number
  discount_amount: number
  final_price: number
}

export async function previewRedeemApi(payload: RedeemPreviewPayload) {
  const { data } = await apiClient.post<ApiResponse<RedeemPreviewResult>>(
    '/loyalty/redeem-preview',
    payload,
  )
  return data.data
}

export async function getActiveTierRulesApi() {
  const { data } = await apiClient.get<ApiResponse<ApiTierRule[]>>(
    '/loyalty/tier-rules',
  )
  return data.data
}