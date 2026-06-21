import type { ApiResponse } from '../types/api'
import type { ApiServicePackage } from '../types/api/staff'
import type { VehicleType } from '../types/washBay'
import { apiClient } from './client'

export async function getServicePackagesApi(vehicleType?: VehicleType) {
  const { data } = await apiClient.get<ApiResponse<ApiServicePackage[]>>(
    '/service-packages',
    { params: vehicleType ? { vehicle_type: vehicleType } : undefined },
  )
  return data.data
}
