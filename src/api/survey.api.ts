import type { ApiResponse } from '../types/api'
import type {
  ApiAnalyticsParams,
  ApiListResponse,
  ApiResearchReport,
  ApiSurvey,
  ApiSurveyResponse,
} from '../types/api/admin'
import { apiClient } from './client'

export interface SurveyListParams {
  page?: number
  limit?: number
  search?: string
  status?: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  created_by?: string
}

export async function getAdminSurveysApi(params?: SurveyListParams) {
  const { data } = await apiClient.get<ApiListResponse<ApiSurvey[]>>('/admin/surveys', {
    params: { limit: 100, ...params },
  })
  return { surveys: data.data, meta: data.meta }
}

export async function getAdminSurveyByIdApi(surveyId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiSurvey>>(`/admin/surveys/${surveyId}`)
  return data.data
}

export async function publishAdminSurveyApi(surveyId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiSurvey>>(
    `/admin/surveys/${surveyId}/publish`,
  )
  return data.data
}

export async function closeAdminSurveyApi(surveyId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiSurvey>>(
    `/admin/surveys/${surveyId}/close`,
  )
  return data.data
}

export async function getAdminSurveyResponsesApi(
  surveyId: string,
  params?: { page?: number; limit?: number },
) {
  const { data } = await apiClient.get<ApiListResponse<ApiSurveyResponse[]>>(
    `/admin/surveys/${surveyId}/responses`,
    { params: { limit: 100, ...params } },
  )
  return { responses: data.data, meta: data.meta }
}

export async function getAdminResearchReportsApi(params?: {
  page?: number
  limit?: number
  status?: string
  type?: string
}) {
  const { data } = await apiClient.get<ApiListResponse<ApiResearchReport[]>>('/admin/research', {
    params: { limit: 50, ...params },
  })
  return { reports: data.data, meta: data.meta }
}

export async function getAdminResearchReportByIdApi(reportId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiResearchReport>>(
    `/admin/research/${reportId}`,
  )
  return data.data
}

export async function createAdminResearchReportApi(payload: {
  title: string
  objective?: string
  type: string
  filters: Record<string, unknown>
}) {
  const { data } = await apiClient.post<ApiResponse<ApiResearchReport>>(
    '/admin/research',
    payload,
  )
  return data.data
}

export async function runAdminResearchReportApi(reportId: string) {
  const { data } = await apiClient.post<ApiResponse<ApiResearchReport>>(
    `/admin/research/${reportId}/run`,
  )
  return data.data
}

export async function retryAdminResearchReportApi(reportId: string) {
  const { data } = await apiClient.post<ApiResponse<ApiResearchReport>>(
    `/admin/research/${reportId}/retry`,
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
