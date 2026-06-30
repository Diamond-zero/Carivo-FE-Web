import type { ApiResponse } from '../types/api'
import type {
  ApiNotification,
  ApiNotificationMeta,
  ApiNotificationRelatedType,
  ApiNotificationType,
} from '../types/api/admin'
import { apiClient } from './client'

export interface NotificationListParams {
  page?: number
  limit?: number
  type?: ApiNotificationType
  related_type?: ApiNotificationRelatedType
  in_app_status?: 'UNREAD' | 'READ'
}

export async function getMyNotificationsApi(params?: NotificationListParams) {
  const { data } = await apiClient.get<
    ApiResponse<ApiNotification[]> & { meta?: ApiNotificationMeta }
  >('/notifications', { params: { limit: 20, ...params } })
  return {
    notifications: data.data,
    meta: data.meta,
  }
}

export async function deleteMyNotificationsApi() {
  const { data } = await apiClient.delete<ApiResponse<{ deleted_count: number }>>(
    '/notifications',
  )
  return data.data
}

export async function getMyUnreadNotificationCountApi() {
  const { data } = await apiClient.get<ApiResponse<{ unread_count: number }>>(
    '/notifications/unread-count',
  )
  return data.data
}

export async function markAllMyNotificationsReadApi() {
  const { data } = await apiClient.patch<ApiResponse<{ modified_count: number }>>(
    '/notifications/mark-all-read',
  )
  return data.data
}

export async function markMyNotificationReadApi(notificationId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiNotification>>(
    `/notifications/${notificationId}/read`,
  )
  return data.data
}

export async function deleteMyNotificationApi(notificationId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiNotification>>(
    `/notifications/${notificationId}`,
  )
  return data.data
}