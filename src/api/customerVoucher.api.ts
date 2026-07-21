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
  source?: 'INCIDENT' | 'CASE' | 'PROMOTION' | string
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
  return { vouchers: data.data, meta: data.meta }
}

export type { ApiResponse }