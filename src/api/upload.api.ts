import type { ApiResponse } from '../types/api'
import type { UploadApiResponse } from '../types/api/staff'
import { apiClient } from './client'

export async function uploadFileApi(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.post<ApiResponse<UploadApiResponse>>(
    '/uploads',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data
}
