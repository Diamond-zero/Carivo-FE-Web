import type { ApiResponse } from '../types/api'
import type { ApiWashHistory } from '../types/api/staff'
import { apiClient } from './client'

export async function getWashHistoriesApi(params?: { limit?: number }) {
  const { data } = await apiClient.get<ApiResponse<ApiWashHistory[]>>(
    '/admin/wash-histories',
    { params: { limit: 100, ...params } },
  )
  return data.data
}
