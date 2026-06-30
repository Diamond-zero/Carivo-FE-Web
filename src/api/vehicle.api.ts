import type { ApiResponse } from '../types/api'
import type { ApiListResponse, ApiVehicle } from '../types/api/admin'
import type {
  ApiCarBodyType,
  ApiMotorbikeCcGroup,
  ApiVehicleEngineType,
} from '../types/api/admin'
import { apiClient } from './client'

export interface VehicleListParams {
  page?: number
  limit?: number
  search?: string
  vehicle_type?: 'MOTORBIKE' | 'CAR'
  engine_type?: ApiVehicleEngineType
  is_active?: boolean
  customer_id?: string
}

export interface VehicleCreatePayload {
  raw_license_plate: string
  vehicle_type: 'MOTORBIKE' | 'CAR'
  engine_type: ApiVehicleEngineType
  motorbike_cc_group?: ApiMotorbikeCcGroup | null
  car_body_type?: ApiCarBodyType | null
  seat_count?: number | null
  brand?: string
  model?: string
  color?: string
  is_default?: boolean
}

export interface AdminVehicleCreatePayload extends VehicleCreatePayload {
  customer_id: string
}

export interface VehicleUpdatePayload {
  raw_license_plate?: string
  vehicle_type?: 'MOTORBIKE' | 'CAR'
  engine_type?: ApiVehicleEngineType
  motorbike_cc_group?: ApiMotorbikeCcGroup | null
  car_body_type?: ApiCarBodyType | null
  seat_count?: number | null
  brand?: string
  model?: string
  color?: string
  is_default?: boolean
  is_active?: boolean
}

export interface AdminVehicleUpdatePayload extends VehicleUpdatePayload {
  customer_id?: string
}

export async function getMyVehiclesApi(params?: VehicleListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiVehicle[]>>(
    '/vehicles',
    { params: { limit: 100, ...params } },
  )
  return { vehicles: data.data, meta: data.meta }
}

export async function getMyVehicleByIdApi(vehicleId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiVehicle>>(
    `/vehicles/${vehicleId}`,
  )
  return data.data
}

export async function createMyVehicleApi(payload: VehicleCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiVehicle>>(
    '/vehicles',
    payload,
  )
  return data.data
}

export async function updateMyVehicleApi(
  vehicleId: string,
  payload: VehicleUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiVehicle>>(
    `/vehicles/${vehicleId}`,
    payload,
  )
  return data.data
}

export async function deleteMyVehicleApi(vehicleId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiVehicle>>(
    `/vehicles/${vehicleId}`,
  )
  return data.data
}

export async function getAdminVehiclesApi(params?: VehicleListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiVehicle[]>>(
    '/admin/vehicles',
    { params: { limit: 100, ...params } },
  )
  return { vehicles: data.data, meta: data.meta }
}

export async function getAdminVehicleByIdApi(vehicleId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiVehicle>>(
    `/admin/vehicles/${vehicleId}`,
  )
  return data.data
}

export async function createAdminVehicleApi(
  payload: AdminVehicleCreatePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiVehicle>>(
    '/admin/vehicles',
    payload,
  )
  return data.data
}

export async function updateAdminVehicleApi(
  vehicleId: string,
  payload: AdminVehicleUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiVehicle>>(
    `/admin/vehicles/${vehicleId}`,
    payload,
  )
  return data.data
}

export async function deleteAdminVehicleApi(vehicleId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiVehicle>>(
    `/admin/vehicles/${vehicleId}`,
  )
  return data.data
}