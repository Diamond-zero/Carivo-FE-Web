import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acknowledgeCustomerCaseApi,
  addCustomerCaseEvidenceApi,
  assignCustomerCaseApi,
  assignTechnicalAssessmentApi,
  createWalkInCustomerCaseApi,
  getCustomerCaseApi,
  getCustomerCaseSlaDashboardApi,
  getMyTechnicalAssessmentApi,
  listGarageCustomerCasesApi,
  recordWalkInResolutionResponseApi,
  requestWalkInOtpApi,
  sendCustomerCaseMessageApi,
  startTechnicalAssessmentApi,
  submitTechnicalAssessmentApi,
  verifyWalkInOtpApi,
} from '../../../api/customerCase.api'
import type {
  ApiAcknowledgeCustomerCasePayload,
  ApiAddCaseEvidencePayload,
  ApiAssignCustomerCasePayload,
  ApiAssignTechnicalAssessmentPayload,
  ApiCreateWalkInCasePayload,
  ApiCustomerCaseListParams,
  ApiRecordWalkInResolutionPayload,
  ApiSendCaseMessagePayload,
  ApiStartTechnicalAssessmentPayload,
  ApiSubmitTechnicalAssessmentPayload,
  ApiWalkInOtpRequestPayload,
  ApiWalkInOtpVerifyPayload,
} from '../../../types/api/customerCase'
import { useAuth } from '../../../contexts/AuthContext'

export const staffCaseQueryKeys = {
  all: ['staff', 'cases'] as const,
  list: (params?: unknown) => ['staff', 'cases', 'list', params] as const,
  detail: (id: string) => ['staff', 'cases', 'detail', id] as const,
  sla: ['staff', 'cases', 'sla'] as const,
  technicalAssessment: (caseId: string) =>
    ['staff', 'cases', 'technical-assessment', caseId] as const,
  walkInOtp: ['staff', 'cases', 'walk-in', 'otp'] as const,
}

export function useStaffCustomerCases(params: ApiCustomerCaseListParams = {}) {
  const { session } = useAuth()
  const garageId = session?.garage?.id
  return useQuery({
    queryKey: staffCaseQueryKeys.list({ ...params, garage_id: garageId }),
    queryFn: () =>
      listGarageCustomerCasesApi({
        ...(garageId ? { garage_id: garageId } : {}),
        ...params,
      }),
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useStaffCustomerCaseDetail(caseId: string | undefined) {
  return useQuery({
    queryKey: staffCaseQueryKeys.detail(caseId ?? ''),
    queryFn: () => getCustomerCaseApi(caseId!),
    enabled: Boolean(caseId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useStaffCustomerCaseSlaDashboard() {
  return useQuery({
    queryKey: staffCaseQueryKeys.sla,
    queryFn: getCustomerCaseSlaDashboardApi,
    staleTime: 30_000,
    refetchOnMount: 'always',
  })
}

export function useAcknowledgeCustomerCaseMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiAcknowledgeCustomerCasePayload = {}) =>
      acknowledgeCustomerCaseApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.all })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.sla })
    },
  })
}

export function useAssignCustomerCaseMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiAssignCustomerCasePayload) =>
      assignCustomerCaseApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.all })
    },
  })
}

export function useAddCustomerCaseEvidenceMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiAddCaseEvidencePayload) =>
      addCustomerCaseEvidenceApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
    },
  })
}

export function useSendCustomerCaseMessageMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiSendCaseMessagePayload) =>
      sendCustomerCaseMessageApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
    },
  })
}

export function useRequestWalkInOtpMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiWalkInOtpRequestPayload) => requestWalkInOtpApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.walkInOtp })
    },
  })
}

export function useVerifyWalkInOtpMutation() {
  return useMutation({
    mutationFn: (payload: ApiWalkInOtpVerifyPayload) => verifyWalkInOtpApi(payload),
  })
}

export function useCreateWalkInCustomerCaseMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiCreateWalkInCasePayload) =>
      createWalkInCustomerCaseApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.all })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.sla })
    },
  })
}

export function useRecordWalkInResolutionMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiRecordWalkInResolutionPayload) =>
      recordWalkInResolutionResponseApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
    },
  })
}

export function useMyTechnicalAssessment(caseId: string | undefined) {
  return useQuery({
    queryKey: staffCaseQueryKeys.technicalAssessment(caseId ?? ''),
    queryFn: () => getMyTechnicalAssessmentApi(caseId!),
    enabled: Boolean(caseId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useAssignTechnicalAssessmentMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiAssignTechnicalAssessmentPayload) =>
      assignTechnicalAssessmentApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.technicalAssessment(caseId),
      })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
    },
  })
}

export function useStartTechnicalAssessmentMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiStartTechnicalAssessmentPayload = {}) =>
      startTechnicalAssessmentApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.technicalAssessment(caseId),
      })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
    },
  })
}

export function useSubmitTechnicalAssessmentMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiSubmitTechnicalAssessmentPayload) =>
      submitTechnicalAssessmentApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.technicalAssessment(caseId),
      })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.detail(caseId) })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.all })
    },
  })
}

// ---- Constants & helpers ----

export const CASE_STATUS_LABELS: Record<string, string> = {
  OPEN: 'Mở mới',
  ACKNOWLEDGED: 'Đã tiếp nhận',
  IN_REVIEW: 'Đang xem xét',
  TECHNICAL_ASSESSMENT: 'Đang đánh giá kỹ thuật',
  AWAITING_CUSTOMER_RESPONSE: 'Chờ khách phản hồi',
  RESOLVED: 'Đã giải quyết',
  CLOSED: 'Đã đóng',
}

export const CASE_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  OPEN: 'warning',
  ACKNOWLEDGED: 'info',
  IN_REVIEW: 'info',
  TECHNICAL_ASSESSMENT: 'info',
  AWAITING_CUSTOMER_RESPONSE: 'warning',
  RESOLVED: 'success',
  CLOSED: 'default',
}

export const CASE_PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Thấp',
  NORMAL: 'Bình thường',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
}

export const CASE_PRIORITY_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  LOW: 'default',
  NORMAL: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
}

export const CASE_CATEGORY_OPTIONS = [
  { value: 'SERVICE_QUALITY', label: 'Chất lượng dịch vụ' },
  { value: 'VEHICLE_DAMAGE', label: 'Hư hỏng xe' },
  { value: 'BILLING', label: 'Thanh toán' },
  { value: 'BOOKING_ISSUE', label: 'Vấn đề đặt lịch' },
  { value: 'STAFF_BEHAVIOR', label: 'Thái độ nhân viên' },
  { value: 'OTHER', label: 'Khác' },
]