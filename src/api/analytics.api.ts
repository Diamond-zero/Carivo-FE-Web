import type { ApiResponse } from '../types/api'
import { apiClient } from './client'

export interface ApiAnalyticsParams {
  from?: string
  to?: string
  garage_id?: string
  service_package_id?: string
  vehicle_type?: 'MOTORBIKE' | 'CAR'
  group_by?: 'DAY' | 'WEEK' | 'MONTH'
}

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

export async function getAnalyticsGaragesApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/garages',
    { params },
  )
  return data.data
}

export async function getAnalyticsServicesApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/services',
    { params },
  )
  return data.data
}

export async function getAnalyticsPromotionsApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/promotions',
    { params },
  )
  return data.data
}

export async function getAnalyticsPaymentsApi(params?: ApiAnalyticsParams) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    '/admin/analytics/payments',
    { params },
  )
  return data.data
}

export async function getAnalyticsSurveyApi(
  surveyId: string,
  params?: ApiAnalyticsParams,
) {
  const { data } = await apiClient.get<ApiResponse<Record<string, unknown>>>(
    `/admin/analytics/surveys/${surveyId}`,
    { params },
  )
  return data.data
}

// Re-export the audit log API + types from its dedicated module so callers
// that previously imported them from `analytics.api` keep working.
export {
  getAdminAuditLogsApi,
  type AuditLogListParams,
  type AuditLogListResult,
} from './auditLog.api'
