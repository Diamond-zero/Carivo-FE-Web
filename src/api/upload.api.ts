import type { ApiResponse } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import type { UploadApiResponse } from '../types/api/staff'
import { apiClient } from './client'

export type UploadPurpose =
  | 'GENERAL'
  | 'USER_AVATAR'
  | 'VEHICLE_INSPECTION'
  | 'SURVEY_RESPONSE'
  | 'CUSTOMER_CASE_EVIDENCE'
  | 'RESEARCH_ATTACHMENT'
  | 'BOOKING_PLATE_SCAN'

export type UploadRelatedType =
  | 'USER'
  | 'BOOKING'
  | 'VEHICLE'
  | 'VEHICLE_INSPECTION'
  | 'SURVEY'
  | 'SURVEY_RESPONSE'
  | 'CUSTOMER_CASE'
  | 'RESEARCH_REPORT'
  | 'WASH_HISTORY'
  | 'GARAGE'
  | 'SERVICE_PACKAGE'
  | 'BOOKING_PLATE_SCAN'

export interface UploadFileOptions {
  purpose?: UploadPurpose
  related_type?: UploadRelatedType
  related_id?: string
}

export interface AdminUploadsListParams {
  page?: number
  limit?: number
  purpose?: string
  owner_id?: string
  related_type?: string
  related_id?: string
  mime_type?: string
  from?: string
  to?: string
}

export async function uploadFileApi(
  file: File,
  options: UploadFileOptions = {},
) {
  const formData = new FormData()
  formData.append('file', file)
  if (options.purpose) formData.append('purpose', options.purpose)
  if (options.related_type)
    formData.append('related_type', options.related_type)
  if (options.related_id) formData.append('related_id', options.related_id)

  const { data } = await apiClient.post<ApiResponse<UploadApiResponse>>(
    '/uploads',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return data.data
}

export async function deleteUploadApi(uploadId: string) {
  const { data } = await apiClient.delete<ApiResponse<UploadApiResponse>>(
    `/uploads/${uploadId}`,
  )
  return data.data
}

export async function getAdminUploadsApi(params?: AdminUploadsListParams) {
  const { data } = await apiClient.get<ApiListResponse<UploadApiResponse[]>>(
    '/admin/uploads',
    { params: { limit: 20, ...params } },
  )
  return { uploads: data.data, meta: data.meta }
}
