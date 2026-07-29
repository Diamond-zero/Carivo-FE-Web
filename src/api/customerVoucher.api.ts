import type { ApiResponse } from '../types/api'
import type { ApiListResponse, ApiPaginationMeta } from '../types/api/admin'
import type { ApiCustomerVoucher } from '../types/api/staff'
import { apiClient } from './client'

export interface CustomerVoucherListParams {
  page?: number
  limit?: number
  status?: string
  customer_id?: string
  garage_id?: string
  source?: 'INCIDENT' | 'CUSTOMER_CASE' | 'ADMIN_GIFT' | string
}

export interface AdminGiftVoucherPayload {
  customer_id: string
  garage_id: string
  voucher_type: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FREE_SERVICE'
  value: number
  max_discount_amount?: number | null
  min_order_amount: number
  service_package_id?: string | null
  expires_at: string
  note: string
}

export interface CustomerVouchersResult {
  vouchers: ApiCustomerVoucher[]
  meta: ApiPaginationMeta
}

export async function getCustomerVouchersApi(
  params?: CustomerVoucherListParams,
): Promise<CustomerVouchersResult> {
  const { data } = await apiClient.get<ApiListResponse<ApiCustomerVoucher[]>>(
    '/admin/customer-vouchers',
    { params },
  )
  return {
    vouchers: data.data,
    meta: data.meta ?? {
      page: params?.page ?? 1,
      limit: params?.limit ?? data.data.length,
      total: data.data.length,
      total_pages: 1,
    },
  }
}

export async function approveCustomerVoucherApi(
  voucherId: string,
  payload: { note?: string | null } = {},
): Promise<ApiCustomerVoucher> {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerVoucher>>(
    `/admin/customer-vouchers/${voucherId}/approve`,
    payload,
  )
  return data.data
}

export async function createAdminGiftVoucherApi(
  payload: AdminGiftVoucherPayload,
): Promise<ApiCustomerVoucher> {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerVoucher>>(
    '/admin/customer-vouchers',
    payload,
  )
  return data.data
}

export async function revokeCustomerVoucherApi(
  voucherId: string,
  payload: { reason?: string } = {},
): Promise<ApiCustomerVoucher> {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerVoucher>>(
    `/admin/customer-vouchers/${voucherId}/revoke`,
    payload,
  )
  return data.data
}

export type { ApiResponse }
