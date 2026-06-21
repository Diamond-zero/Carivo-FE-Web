import type { ApiResponse } from '../types/api'
import type { ApiWashHistory } from '../types/api/staff'
import type { VehicleType } from '../types/washBay'
import { apiClient } from './client'

export interface WashHistoryListParams {
  garage_id?: string
  customer_id?: string
  vehicle_id?: string
  service_package_id?: string
  vehicle_type?: VehicleType
  from?: string
  to?: string
  page?: number
  limit?: number
}

export interface WashHistoryListResult {
  histories: ApiWashHistory[]
  meta?: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export async function getWashHistoriesApi(
  params?: WashHistoryListParams,
): Promise<WashHistoryListResult> {
  const { data } = await apiClient.get<
    ApiResponse<ApiWashHistory[]> & {
      meta?: WashHistoryListResult['meta']
    }
  >('/admin/wash-histories', { params: { limit: 100, ...params } })

  return {
    histories: data.data,
    meta: data.meta,
  }
}

export async function getWashHistoryByIdApi(historyId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiWashHistory>>(
    `/admin/wash-histories/${historyId}`,
  )
  return data.data
}
