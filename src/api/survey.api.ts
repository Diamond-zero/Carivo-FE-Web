import type { ApiResponse } from '../types/api'
import type {
  ApiAnalyticsParams,
  ApiListResponse,
  ApiResearchReport,
  ApiResearchFilters,
  ApiSurvey,
  ApiSurveyQuestion,
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

export interface SurveyQuestionWrite {
  text: string
  type: 'RATING' | 'NPS' | 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TEXT'
  is_required: boolean
  options: string[]
  order: number
}

export interface SurveyCreatePayload {
  title: string
  description?: string | null
  questions?: SurveyQuestionWrite[]
  response_window_days?: number
}

export interface SurveyUpdatePayload {
  title?: string
  description?: string | null
  questions?: SurveyQuestionWrite[]
  response_window_days?: number
}

export interface SurveyResponseListParams {
  page?: number
  limit?: number
  customer_id?: string
  booking_id?: string
  from?: string
  to?: string
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

export async function createAdminSurveyApi(payload: SurveyCreatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiSurvey>>(
    '/admin/surveys',
    payload,
  )
  return data.data
}

export async function updateAdminSurveyApi(
  surveyId: string,
  payload: SurveyUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiSurvey>>(
    `/admin/surveys/${surveyId}`,
    payload,
  )
  return data.data
}

export async function deleteAdminSurveyApi(surveyId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiSurvey>>(
    `/admin/surveys/${surveyId}`,
  )
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
  params?: SurveyResponseListParams,
) {
  const { data } = await apiClient.get<ApiListResponse<ApiSurveyResponse[]>>(
    `/admin/surveys/${surveyId}/responses`,
    { params: { limit: 100, ...params } },
  )
  return { responses: data.data, meta: data.meta }
}

export async function getCustomerAvailableSurveysApi(bookingId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiSurvey[]>>(
    '/surveys/available',
    { params: { booking_id: bookingId } },
  )
  return data.data
}

export interface SubmitSurveyResponsePayload {
  booking_id: string
  answers: Array<{
    question_id: string
    value: number | string | string[]
  }>
  upload_ids?: string[]
}

export async function submitSurveyResponseApi(
  surveyId: string,
  payload: SubmitSurveyResponsePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiSurveyResponse>>(
    `/surveys/${surveyId}/responses`,
    payload,
  )
  return data.data
}

export interface ResearchListParams {
  page?: number
  limit?: number
  status?: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  type?: 'SURVEY_INSIGHT'
  created_by?: string
  survey_id?: string
}

export interface ResearchReportCreatePayload {
  title: string
  objective: string
  type?: 'SURVEY_INSIGHT'
  filters: ApiResearchFilters
}

export async function getAdminResearchReportsApi(params?: ResearchListParams) {
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

export async function createAdminResearchReportApi(
  payload: ResearchReportCreatePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiResearchReport>>(
    '/admin/research',
    payload,
  )
  return data.data
}

export async function updateAdminResearchReportApi(
  reportId: string,
  payload: ResearchReportCreatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiResearchReport>>(
    `/admin/research/${reportId}`,
    payload,
  )
  return data.data
}

export async function deleteAdminResearchReportApi(reportId: string) {
  const { data } = await apiClient.delete<ApiResponse<ApiResearchReport>>(
    `/admin/research/${reportId}`,
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

// ----------------------------------------------------------------------------
// Back-compat re-exports: the 3 analytics routes below live canonically in
// `./analytics.api`. Some legacy call-sites may still import them from this
// module — keep them re-exported to avoid breaking those imports.
// ----------------------------------------------------------------------------
export {
  getAnalyticsGaragesApi,
  getAnalyticsServicesApi,
  getAnalyticsPromotionsApi,
} from './analytics.api'

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
