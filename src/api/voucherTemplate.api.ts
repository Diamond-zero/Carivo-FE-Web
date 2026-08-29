import type { ApiResponse } from '../types/api'
import type { ApiListResponse, ApiVoucherTemplate, ApiVoucherType } from '../types/api/admin'
import type { LoyaltyTier } from '../types/loyalty'
import { apiClient } from './client'

export interface VoucherTemplateListParams {
  page?: number
  limit?: number
  search?: string
  voucher_type?: ApiVoucherType
  tier?: LoyaltyTier
  is_active?: boolean
  valid_only?: boolean
}

export interface VoucherTemplateListResult {
  voucherTemplates: ApiVoucherTemplate[]
  meta?: ApiListResponse<ApiVoucherTemplate[]>['meta']
}

export interface VoucherTemplateCreatePayload {
  name: string
  description?: string | null
  voucher_type: ApiVoucherType
  value: number
  max_discount_amount?: number | null
  min_order_amount?: number
  service_package_id?: string | null
  points_cost: number
  voucher_validity_days: number
  total_quantity?: number | null
  per_customer_limit?: number | null
  applicable_tiers?: LoyaltyTier[]
  start_at: string
  end_at: string
  is_active?: boolean
}

export type VoucherTemplateUpdatePayload = Partial<VoucherTemplateCreatePayload>

export async function getAdminVoucherTemplatesApi(
  params?: VoucherTemplateListParams,
): Promise<VoucherTemplateListResult> {
  const { data } = await apiClient.get<ApiListResponse<ApiVoucherTemplate[]>>(
    '/admin/voucher-templates',
    { params },
  )
  return { voucherTemplates: data.data, meta: data.meta }
}

export async function getAdminVoucherTemplateByIdApi(voucherTemplateId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiVoucherTemplate>>(
    `/admin/voucher-templates/${voucherTemplateId}`,
  )
  return data.data
}

export async function createAdminVoucherTemplateApi(payload: VoucherTemplateCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiVoucherTemplate>>(
    '/admin/voucher-templates',
    payload,
  )
  return data.data
}

export async function updateAdminVoucherTemplateApi(
  voucherTemplateId: string,
  payload: VoucherTemplateUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiVoucherTemplate>>(
    `/admin/voucher-templates/${voucherTemplateId}`,
    payload,
  )
  return data.data
}

export async function deleteAdminVoucherTemplateApi(voucherTemplateId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiVoucherTemplate>>(
    `/admin/voucher-templates/${voucherTemplateId}`,
  )
  return data.data
}

export async function activateAdminVoucherTemplateApi(voucherTemplateId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiVoucherTemplate>>(
    `/admin/voucher-templates/${voucherTemplateId}/activate`,
  )
  return data.data
}

export async function deactivateAdminVoucherTemplateApi(voucherTemplateId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiVoucherTemplate>>(
    `/admin/voucher-templates/${voucherTemplateId}/deactivate`,
  )
  return data.data
}
