import type { ApiResponse } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import type { ApiWashBay } from '../types/api/staff'
import type { VehicleType, WashBayStatus } from '../types/washBay'
import { apiClient } from './client'

export interface WashBayListParams {
  page?: number
  limit?: number
  search?: string
  vehicle_type?: VehicleType
  status?: WashBayStatus
  is_active?: boolean
  garage_id?: string
}

export interface WashBayCreatePayload {
  garage_id: string
  name: string
  bay_code: string
  vehicle_type: VehicleType
  status?: WashBayStatus
  is_active?: boolean
}

export type WashBayUpdatePayload = Partial<Omit<WashBayCreatePayload, 'garage_id' | 'status'>>

export async function getGarageWashBaysApi(garageId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiWashBay[]>>(
    `/admin/garages/${garageId}/wash-bays`,
  )
  return data.data
}

export async function getAvailableWashBaysApi(
  garageId: string,
  vehicleType?: VehicleType,
) {
  const { data } = await apiClient.get<ApiResponse<ApiWashBay[]>>(
    `/admin/garages/${garageId}/available-wash-bays`,
    { params: vehicleType ? { vehicle_type: vehicleType } : undefined },
  )
  return data.data
}

export async function getAdminWashBaysApi(params?: WashBayListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiWashBay[]>>(
    '/admin/wash-bays',
    { params: { limit: 100, ...params } },
  )
  return { washBays: data.data, meta: data.meta }
}

export async function getAdminWashBayByIdApi(washBayId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiWashBay>>(
    `/admin/wash-bays/${washBayId}`,
  )
  return data.data
}

export async function createAdminWashBayApi(payload: WashBayCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiWashBay>>(
    '/admin/wash-bays',
    payload,
  )
  return data.data
}

export async function updateAdminWashBayApi(
  washBayId: string,
  payload: WashBayUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiWashBay>>(
    `/admin/wash-bays/${washBayId}`,
    payload,
  )
  return data.data
}

export async function updateAdminWashBayStatusApi(
  washBayId: string,
  status: 'AVAILABLE' | 'MAINTENANCE' | 'INACTIVE',
) {
  const { data } = await apiClient.patch<ApiResponse<ApiWashBay>>(
    `/admin/wash-bays/${washBayId}/status`,
    { status },
  )
  return data.data
}

export async function deleteAdminWashBayApi(washBayId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiWashBay>>(
    `/admin/wash-bays/${washBayId}`,
  )
  return data.data
}
