import type { ApiListResponse, ApiResponse } from '../types/api'
import type {
  ApiAcknowledgeCustomerCasePayload,
  ApiAddCaseEvidencePayload,
  ApiAssignCustomerCasePayload,
  ApiAssignTechnicalAssessmentPayload,
  ApiCreateWalkInCasePayload,
  ApiCustomerCase,
  ApiCustomerCaseListParams,
  ApiCustomerCaseSlaDashboard,
  ApiRecordWalkInResolutionPayload,
  ApiSendCaseMessagePayload,
  ApiStartTechnicalAssessmentPayload,
  ApiSubmitTechnicalAssessmentPayload,
  ApiTechnicalAssessment,
  ApiWalkInOtpRequestPayload,
  ApiWalkInOtpRequestResponse,
  ApiWalkInOtpVerifyPayload,
  ApiWalkInOtpVerifyResponse,
} from '../types/api/customerCase'
import { apiClient } from './client'

// ---- Garage-scoped case CRUD ----

export async function listGarageCustomerCasesApi(params: ApiCustomerCaseListParams = {}) {
  const { data } = await apiClient.get<ApiListResponse<ApiCustomerCase[]>>(
    '/admin/customer-cases',
    { params: { page: 1, limit: 20, ...params } },
  )
  return data
}

export async function getCustomerCaseApi(id: string) {
  const { data } = await apiClient.get<ApiResponse<ApiCustomerCase>>(
    `/admin/customer-cases/${id}`,
  )
  return data.data
}

export async function acknowledgeCustomerCaseApi(
  id: string,
  payload: ApiAcknowledgeCustomerCasePayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCase>>(
    `/admin/customer-cases/${id}/acknowledge`,
    payload,
  )
  return data.data
}

export async function assignCustomerCaseApi(
  id: string,
  payload: ApiAssignCustomerCasePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCase>>(
    `/admin/customer-cases/${id}/assign`,
    payload,
  )
  return data.data
}

export async function addCustomerCaseEvidenceApi(
  id: string,
  payload: ApiAddCaseEvidencePayload,
) {
  const { data } = await apiClient.post<ApiResponse<{ evidence_id: string }>>(
    `/admin/customer-cases/${id}/evidence`,
    payload,
  )
  return data.data
}

export async function sendCustomerCaseMessageApi(
  id: string,
  payload: ApiSendCaseMessagePayload,
) {
  const { data } = await apiClient.post<ApiResponse<{ message_id: string }>>(
    `/admin/customer-cases/${id}/messages`,
    payload,
  )
  return data.data
}

// ---- SLA dashboard ----

export async function getCustomerCaseSlaDashboardApi() {
  const { data } = await apiClient.get<ApiResponse<ApiCustomerCaseSlaDashboard>>(
    '/staff/customer-cases/sla-dashboard',
  )
  return data.data
}

// ---- Walk-in OTP + case ----

export async function requestWalkInOtpApi(payload: ApiWalkInOtpRequestPayload) {
  const { data } = await apiClient.post<ApiResponse<ApiWalkInOtpRequestResponse>>(
    '/staff/customer-cases/walk-in/otp/request',
    payload,
  )
  return data.data
}

export async function verifyWalkInOtpApi(payload: ApiWalkInOtpVerifyPayload) {
  const { data } = await apiClient.post<ApiResponse<ApiWalkInOtpVerifyResponse>>(
    '/staff/customer-cases/walk-in/otp/verify',
    payload,
  )
  return data.data
}

export async function createWalkInCustomerCaseApi(
  payload: ApiCreateWalkInCasePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCustomerCase>>(
    '/staff/customer-cases/walk-in',
    payload,
  )
  return data.data
}

export async function recordWalkInResolutionResponseApi(
  caseId: string,
  payload: ApiRecordWalkInResolutionPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCustomerCase>>(
    `/staff/customer-cases/${caseId}/walk-in-resolution-response`,
    payload,
  )
  return data.data
}

// ---- Technical assessment ----

export async function getMyTechnicalAssessmentApi(caseId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiTechnicalAssessment>>(
    `/staff/customer-cases/${caseId}/technical-assessment`,
  )
  return data.data
}

export async function assignTechnicalAssessmentApi(
  caseId: string,
  payload: ApiAssignTechnicalAssessmentPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiTechnicalAssessment>>(
    `/staff/customer-cases/${caseId}/technical-assessment/assign`,
    payload,
  )
  return data.data
}

export async function startTechnicalAssessmentApi(
  caseId: string,
  payload: ApiStartTechnicalAssessmentPayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiTechnicalAssessment>>(
    `/staff/customer-cases/${caseId}/technical-assessment/start`,
    payload,
  )
  return data.data
}

export async function submitTechnicalAssessmentApi(
  caseId: string,
  payload: ApiSubmitTechnicalAssessmentPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiTechnicalAssessment>>(
    `/staff/customer-cases/${caseId}/technical-assessment/submit`,
    payload,
  )
  return data.data
}