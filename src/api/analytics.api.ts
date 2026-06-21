import type { ApiResponse } from '../types/api'
import type { ApiAnalyticsParams, ApiAuditLog, ApiListResponse } from '../types/api/admin'
import { apiClient } from './client'

export async function getAnalyticsOverviewApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/overview',
    { params },
  )
  return data.data
}

export async function getAnalyticsBookingsApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/bookings',
    { params },
  )
  return data.data
}

export async function getAnalyticsRevenueApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/revenue',
    { params },
  )
  return data.data
}

export async function getAnalyticsWashBaysApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/wash-bays',
    { params },
  )
  return data.data
}

export interface AuditLogListParams {
  page?: number
  limit?: number
  actor_id?: string
  action?: string
  resource_type?: string
  resource_id?: string
  ip?: string
  from?: string
  to?: string
}

export async function getAdminAuditLogsApi(params?: AuditLogListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiAuditLog[]>>(
    '/admin/audit-logs',
    { params: { limit: 50, ...params } },
  )
  return { logs: data.data, meta: data.meta }
}
