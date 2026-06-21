import type { ApiGarage, ApiResponse } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import { apiClient } from './client'

export interface GarageListParams {
  page?: number
  limit?: number
  search?: string
  city?: string
  district?: string
  is_active?: boolean
}

export type GarageCreatePayload = Omit<ApiGarage, 'id' | 'created_at' | 'updated_at'>
export type GarageUpdatePayload = Partial<GarageCreatePayload>

export async function getAdminGaragesApi(params?: GarageListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiGarage[]>>('/admin/garages', {
    params: { limit: 100, ...params },
  })
  return { garages: data.data, meta: data.meta }
}

export async function getAdminGarageByIdApi(garageId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiGarage>>(
    `/admin/garages/${garageId}`,
  )
  return data.data
}

export async function createAdminGarageApi(payload: GarageCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiGarage>>(
    '/admin/garages',
    payload,
  )
  return data.data
}

export async function updateAdminGarageApi(
  garageId: string,
  payload: GarageUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiGarage>>(
    `/admin/garages/${garageId}`,
    payload,
  )
  return data.data
}

export async function toggleAdminGarageStatusApi(garageId: string, isActive: boolean) {
  const { data } = await apiClient.patch<ApiResponse<ApiGarage>>(
    `/admin/garages/${garageId}/status`,
    { is_active: isActive },
  )
  return data.data
}
