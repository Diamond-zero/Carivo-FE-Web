import type { ApiListResponse, ApiResponse, ApiUser } from '../types/api'
import { apiClient } from './client'

export interface UpdateProfilePayload {
  full_name?: string
  email?: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export interface UpdateMeProfilePayload {
  full_name?: string
  email?: string
  phone?: string
  current_password?: string
  phone_verification_token?: string
  avatar_url?: string | null
}

export interface AdminUpdateUserPayload {
  full_name?: string
  email?: string
  phone?: string
  avatar_url?: string | null
  role?: 'CUSTOMER' | 'STAFF' | 'ADMIN'
  is_active?: boolean
}

export interface UpdateUserRolePayload {
  role: 'CUSTOMER' | 'STAFF' | 'ADMIN'
}

export interface UserListParams {
  page?: number
  limit?: number
  search?: string
  role?: 'CUSTOMER' | 'STAFF' | 'ADMIN'
  is_active?: boolean
}

export async function getMyProfileApi() {
  const { data } = await apiClient.get<ApiResponse<ApiUser>>('/users/me')
  return data.data
}

export async function updateMyProfileApi(payload: UpdateMeProfilePayload) {
  const { data } = await apiClient.patch<ApiResponse<ApiUser>>(
    '/users/me',
    payload,
  )
  return data.data
}

export async function changePasswordApi(payload: ChangePasswordPayload) {
  const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
    '/auth/change-password',
    payload,
  )
  return data.data
}

export async function getCurrentUserApi() {
  const { data } = await apiClient.get<ApiResponse<ApiUser>>('/auth/me')
  return data.data
}

export async function logoutAllApi() {
  const { data } = await apiClient.post<ApiResponse<null>>('/auth/logout-all')
  return data.data
}

export async function getAdminUsersApi(params?: UserListParams) {
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

export async function adminUpdateUserApi(
  userId: string,
  payload: AdminUpdateUserPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiUser>>(
    `/users/${userId}`,
    payload,
  )
  return data.data
}

export async function adminDeleteUserApi(userId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiUser>>(
    `/users/${userId}`,
  )
  return data.data
}

export async function adminUpdateUserRoleApi(
  userId: string,
  payload: UpdateUserRolePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiUser>>(
    `/users/${userId}/role`,
    payload,
  )
  return data.data
}