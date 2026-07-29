import type { ApiListResponse } from '../types/api/admin'
import type { ApiResponse } from '../types/api'
import type {
  ApiAcknowledgeCustomerCasePayload,
  ApiAddCaseEvidencePayload,
  ApiAssignCustomerCasePayload,
  ApiAssignTechnicalAssessmentPayload,
  ApiCloseCustomerCasePayload,
  ApiConcludeCustomerCasePayload,
  ApiCreateWalkInCasePayload,
  ApiCustomerCase,
  ApiCustomerCaseDetail,
  ApiCustomerCaseListParams,
  ApiCustomerCaseSlaDashboard,
  ApiProposeCustomerCaseResolutionPayload,
  ApiRecordWalkInResolutionPayload,
  ApiReopenCustomerCasePayload,
  ApiSendCaseMessagePayload,
  ApiSubmitTechnicalAssessmentPayload,
  ApiUpdateCustomerCaseRefundPayload,
} from '../types/api/customerCase'
import { apiClient } from './client'

export async function listGarageCustomerCasesApi(
  params: ApiCustomerCaseListParams = {},
) {
  const { data } = await apiClient.get<ApiListResponse<ApiCustomerCase[]>>(
    '/staff/customer-cases',
    { params: { page: 1, limit: 20, ...params } },
  )
  return data
}

export async function getCustomerCaseApi(id: string) {
  const { data } = await apiClient.get<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${id}`,
  )
  return data.data
}

export async function acknowledgeCustomerCaseApi(
  id: string,
  payload: ApiAcknowledgeCustomerCasePayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${id}/acknowledge`,
    payload,
  )
  return data.data
}

export async function assignCustomerCaseApi(
  id: string,
  payload: ApiAssignCustomerCasePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${id}/assign`,
    payload,
  )
  return data.data
}

export async function addCustomerCaseEvidenceApi(
  id: string,
  payload: ApiAddCaseEvidencePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${id}/evidence`,
    payload,
  )
  return data.data
}

export async function sendCustomerCaseMessageApi(
  id: string,
  payload: ApiSendCaseMessagePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${id}/messages`,
    payload,
  )
  return data.data
}

export async function getCustomerCaseSlaDashboardApi() {
  const { data } = await apiClient.get<
    ApiResponse<ApiCustomerCaseSlaDashboard>
  >('/staff/customer-cases/sla-dashboard')
  return data.data
}

export async function createWalkInCustomerCaseApi(
  payload: ApiCreateWalkInCasePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    '/staff/customer-cases/walk-in',
    payload,
  )
  return data.data
}

export async function recordWalkInResolutionResponseApi(
  caseId: string,
  payload: ApiRecordWalkInResolutionPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${caseId}/walk-in-resolution-response`,
    payload,
  )
  return data.data
}

export async function getMyTechnicalAssessmentApi(caseId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${caseId}/technical-assessment`,
  )
  return data.data
}

export async function assignTechnicalAssessmentApi(
  caseId: string,
  payload: ApiAssignTechnicalAssessmentPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${caseId}/technical-assessment/assign`,
    payload,
  )
  return data.data
}

export async function startTechnicalAssessmentApi(caseId: string) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${caseId}/technical-assessment/start`,
  )
  return data.data
}

export async function submitTechnicalAssessmentApi(
  caseId: string,
  payload: ApiSubmitTechnicalAssessmentPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/staff/customer-cases/${caseId}/technical-assessment/submit`,
    payload,
  )
  return data.data
}

export async function listAdminCustomerCasesApi(
  params: ApiCustomerCaseListParams = {},
) {
  const { data } = await apiClient.get<ApiListResponse<ApiCustomerCase[]>>(
    '/admin/customer-cases',
    { params: { page: 1, limit: 20, ...params } },
  )
  return data
}

export async function getAdminCustomerCaseApi(id: string) {
  const { data } = await apiClient.get<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}`,
  )
  return data.data
}

export async function getAdminCustomerCaseSlaDashboardApi(
  garageId?: string,
) {
  const { data } = await apiClient.get<
    ApiResponse<ApiCustomerCaseSlaDashboard>
  >('/admin/customer-cases/sla-dashboard', {
    params: garageId ? { garage_id: garageId } : undefined,
  })
  return data.data
}

export async function assignAdminCustomerCaseApi(
  id: string,
  payload: ApiAssignCustomerCasePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/assign`,
    payload,
  )
  return data.data
}

export async function acknowledgeAdminCustomerCaseApi(
  id: string,
  payload: ApiAcknowledgeCustomerCasePayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/acknowledge`,
    payload,
  )
  return data.data
}

export async function addAdminCustomerCaseEvidenceApi(
  id: string,
  payload: ApiAddCaseEvidencePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/evidence`,
    payload,
  )
  return data.data
}

export async function sendAdminCustomerCaseMessageApi(
  id: string,
  payload: ApiSendCaseMessagePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/messages`,
    payload,
  )
  return data.data
}

export async function assignAdminTechnicalAssessmentApi(
  id: string,
  payload: ApiAssignTechnicalAssessmentPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/technical-assessment/assign`,
    payload,
  )
  return data.data
}

export async function proposeAdminCustomerCaseResolutionApi(
  id: string,
  payload: ApiProposeCustomerCaseResolutionPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/resolutions`,
    payload,
  )
  return data.data
}

export async function applyAdminCustomerCaseResolutionApi(
  id: string,
  resolutionId: string,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/resolutions/${resolutionId}/apply`,
  )
  return data.data
}

export async function concludeAdminCustomerCaseApi(
  id: string,
  payload: ApiConcludeCustomerCasePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/conclude`,
    payload,
  )
  return data.data
}

export async function closeAdminCustomerCaseApi(
  id: string,
  payload: ApiCloseCustomerCasePayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/close`,
    payload,
  )
  return data.data
}

export async function updateAdminCustomerCaseRefundApi(
  id: string,
  refundId: string,
  payload: ApiUpdateCustomerCaseRefundPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/refunds/${refundId}`,
    payload,
  )
  return data.data
}

export async function reopenAdminCustomerCaseApi(
  id: string,
  payload: ApiReopenCustomerCasePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCaseDetail>>(
    `/admin/customer-cases/${id}/reopen`,
    payload,
  )
  return data.data
}
