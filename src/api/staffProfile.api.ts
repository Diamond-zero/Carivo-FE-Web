import type { ApiResponse, ApiStaffProfile } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import { apiClient } from './client'

export type StaffTypeValue =
  | 'CUSTOMER_SERVICE_STAFF'
  | 'VEHICLE_INSPECTION_STAFF'
  | 'WASH_OPERATOR'
  | 'VEHICLE_CARE_STAFF'

export { getAdminUsersApi, getUserByIdApi, updateUserStatusApi, type UserListParams } from './user.api'

export interface StaffProfileListParams {
  page?: number
  limit?: number
  search?: string
  staff_type?: string
  garage_id?: string
  user_id?: string
  is_active?: boolean
}

export interface StaffProfileCreatePayload {
  user_id: string
  staff_code: string
  staff_type: StaffTypeValue
  garage_id?: string | null
  is_active?: boolean
}

export interface StaffProfileUpdatePayload {
  staff_code?: string
  staff_type?: StaffTypeValue
  garage_id?: string | null
  is_active?: boolean
}

export async function getStaffProfilesApi(params?: StaffProfileListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiStaffProfile[]>>(
    '/staff-profiles',
    { params: { limit: 100, ...params } },
  )
  return { profiles: data.data, meta: data.meta }
}

export async function getStaffProfileByIdApi(profileId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiStaffProfile>>(
    `/staff-profiles/${profileId}`,
  )
  return data.data
}

export async function createStaffProfileApi(payload: StaffProfileCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiStaffProfile>>(
    '/staff-profiles',
    payload,
  )
  return data.data
}

export async function updateStaffProfileApi(
  profileId: string,
  payload: StaffProfileUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiStaffProfile>>(
    `/staff-profiles/${profileId}`,
    payload,
  )
  return data.data
}

export async function toggleStaffProfileStatusApi(
  profileId: string,
  isActive: boolean,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiStaffProfile>>(
    `/staff-profiles/${profileId}/status`,
    { is_active: isActive },
  )
  return data.data
}

export async function deleteStaffProfileApi(profileId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiStaffProfile>>(
    `/staff-profiles/${profileId}`,
  )
  return data.data
}
