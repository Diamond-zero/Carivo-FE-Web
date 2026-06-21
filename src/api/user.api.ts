import type { ApiResponse, ApiUser } from '../types/api'
import { apiClient } from './client'

export interface UpdateProfilePayload {
  full_name?: string
  email?: string
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
}

export async function getMyProfileApi() {
  const { data } = await apiClient.get<ApiResponse<ApiUser>>('/users/me')
  return data.data
}

export async function updateMyProfileApi(payload: UpdateProfilePayload) {
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
