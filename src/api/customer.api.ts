import type { ApiResponse } from '../types/api'
import type { ApiStaffCustomer } from '../types/api/staff'
import { apiClient } from './client'

export interface StaffCustomerSearchParams {
  garage_id: string
  search?: string
  page?: number
  limit?: number
}

export interface StaffCustomerSearchResult {
  customers: ApiStaffCustomer[]
  meta?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export async function searchStaffCustomersApi(
  params: StaffCustomerSearchParams,
): Promise<StaffCustomerSearchResult> {
  const { data } = await apiClient.get<
    ApiResponse<ApiStaffCustomer[]> & {
      meta?: StaffCustomerSearchResult['meta']
    }
  >('/admin/customers', { params: { limit: 20, ...params } })

  return {
    customers: data.data,
    meta: data.meta,
  }
}
