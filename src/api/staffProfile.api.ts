import type { ApiResponse, ApiStaffProfile, ApiUser } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import { apiClient } from './client'

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: 'CUSTOMER' | 'STAFF' | 'ADMIN'
  is_active?: boolean
}

export async function getUsersApi(params?: UserListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiUser[]>>('/users', {
    params: { limit: 100, ...params },
  })
  return { users: data.data, meta: data.meta }
}

export async function getUserByIdApi(userId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiUser>>(`/users/${userId}`)
  return data.data
}

export async function updateUserStatusApi(userId: string, isActive: boolean) {
  const { data } = await apiClient.patch<ApiResponse<ApiUser>>(
    `/users/${userId}/status`,
    { is_active: isActive },
  )
  return data.data
}

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
  user_id?: string
  full_name?: string
  email?: string
  phone?: string
  password?: string
  staff_code: string
  staff_type: string
  garage_id: string
  is_active?: boolean
}

export interface StaffProfileUpdatePayload {
  staff_code?: string
  staff_type?: string
  garage_id?: string
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
