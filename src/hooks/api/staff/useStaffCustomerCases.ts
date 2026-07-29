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
  sendCustomerCaseMessageApi,
  startTechnicalAssessmentApi,
  submitTechnicalAssessmentApi,
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
  ApiSubmitTechnicalAssessmentPayload,
} from '../../../types/api/customerCase'
import { useAuth } from '../../../contexts/AuthContext'
export {
  CASE_CATEGORY_LABELS,
  CASE_CATEGORY_OPTIONS,
  CASE_PRIORITY_LABELS,
  CASE_PRIORITY_VARIANT,
  CASE_STATUS_LABELS,
  CASE_STATUS_VARIANT,
} from '../../../constants/customerCase'

export const staffCaseQueryKeys = {
  all: ['staff', 'cases'] as const,
  list: (params?: unknown) => ['staff', 'cases', 'list', params] as const,
  detail: (id: string) => ['staff', 'cases', 'detail', id] as const,
  sla: ['staff', 'cases', 'sla'] as const,
  technicalAssessment: (caseId: string) =>
    ['staff', 'cases', 'technical-assessment', caseId] as const,
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

export function useStaffCustomerCaseSlaDashboard(enabled = true) {
  return useQuery({
    queryKey: staffCaseQueryKeys.sla,
    queryFn: getCustomerCaseSlaDashboardApi,
    enabled,
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
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
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
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
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
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
    },
  })
}

export function useSendCustomerCaseMessageMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiSendCaseMessagePayload) =>
      sendCustomerCaseMessageApi(caseId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
    },
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
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
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
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
    },
  })
}

export function useStartTechnicalAssessmentMutation(caseId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => startTechnicalAssessmentApi(caseId),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.technicalAssessment(caseId),
      })
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
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
      void qc.invalidateQueries({
        queryKey: staffCaseQueryKeys.detail(caseId),
      })
      void qc.invalidateQueries({ queryKey: staffCaseQueryKeys.all })
    },
  })
}
