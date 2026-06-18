import type { ApiGarage, ApiResponse, ApiStaffProfile } from '../types/api'
import { apiClient } from './client'

export async function getMyStaffProfileApi() {
  const { data } = await apiClient.get<ApiResponse<ApiStaffProfile>>(
    '/staff-profiles/me',
  )
  return data.data
}

export async function getGarageByIdApi(garageId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiGarage>>(
    `/garages/${garageId}`,
  )
  return data.data
}
