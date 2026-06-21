import type { ApiResponse } from '../types/api'
import type { ApiWashBay } from '../types/api/staff'
import type { VehicleType } from '../types/washBay'
import { apiClient } from './client'

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
