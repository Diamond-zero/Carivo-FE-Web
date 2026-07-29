import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acknowledgeAdminCustomerCaseApi,
  addAdminCustomerCaseEvidenceApi,
  applyAdminCustomerCaseResolutionApi,
  assignAdminCustomerCaseApi,
  assignAdminTechnicalAssessmentApi,
  closeAdminCustomerCaseApi,
  concludeAdminCustomerCaseApi,
  getAdminCustomerCaseApi,
  getAdminCustomerCaseSlaDashboardApi,
  listAdminCustomerCasesApi,
  proposeAdminCustomerCaseResolutionApi,
  reopenAdminCustomerCaseApi,
  sendAdminCustomerCaseMessageApi,
  updateAdminCustomerCaseRefundApi,
} from '../../../api/customerCase.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import type {
  ApiAcknowledgeCustomerCasePayload,
  ApiAddCaseEvidencePayload,
  ApiAssignCustomerCasePayload,
  ApiAssignTechnicalAssessmentPayload,
  ApiCloseCustomerCasePayload,
  ApiConcludeCustomerCasePayload,
  ApiCustomerCaseListParams,
  ApiProposeCustomerCaseResolutionPayload,
  ApiReopenCustomerCasePayload,
  ApiSendCaseMessagePayload,
  ApiUpdateCustomerCaseRefundPayload,
} from '../../../types/api/customerCase'

export const adminCustomerCaseQueryKeys = {
  all: ['admin', 'customer-cases'] as const,
  list: (params?: unknown) =>
    ['admin', 'customer-cases', 'list', params] as const,
  detail: (id: string) =>
    ['admin', 'customer-cases', 'detail', id] as const,
  sla: (garageId?: string) =>
    ['admin', 'customer-cases', 'sla', garageId ?? 'ALL'] as const,
}

export function useAdminCustomerCases(
  params: ApiCustomerCaseListParams = {},
) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminCustomerCaseQueryKeys.list(params),
    queryFn: () => listAdminCustomerCasesApi(params),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
    placeholderData: (previousData) => previousData,
  })
}

export function useAdminCustomerCaseDetail(caseId: string | undefined) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminCustomerCaseQueryKeys.detail(caseId ?? ''),
    queryFn: () => getAdminCustomerCaseApi(caseId!),
    enabled: isAuthenticated && Boolean(caseId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useAdminCustomerCaseSlaDashboard(garageId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminCustomerCaseQueryKeys.sla(garageId),
    queryFn: () => getAdminCustomerCaseSlaDashboardApi(garageId),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

function useInvalidateAdminCustomerCase(caseId: string) {
  const queryClient = useQueryClient()

  return () => {
    void queryClient.invalidateQueries({
      queryKey: adminCustomerCaseQueryKeys.detail(caseId),
    })
    void queryClient.invalidateQueries({
      queryKey: adminCustomerCaseQueryKeys.all,
    })
  }
}

export function useAssignAdminCustomerCaseMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiAssignCustomerCasePayload) =>
      assignAdminCustomerCaseApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useAcknowledgeAdminCustomerCaseMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiAcknowledgeCustomerCasePayload = {}) =>
      acknowledgeAdminCustomerCaseApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useAddAdminCustomerCaseEvidenceMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiAddCaseEvidencePayload) =>
      addAdminCustomerCaseEvidenceApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useSendAdminCustomerCaseMessageMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiSendCaseMessagePayload) =>
      sendAdminCustomerCaseMessageApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useAssignAdminTechnicalAssessmentMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiAssignTechnicalAssessmentPayload) =>
      assignAdminTechnicalAssessmentApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useProposeAdminCustomerCaseResolutionMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiProposeCustomerCaseResolutionPayload) =>
      proposeAdminCustomerCaseResolutionApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useApplyAdminCustomerCaseResolutionMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (resolutionId: string) =>
      applyAdminCustomerCaseResolutionApi(caseId, resolutionId),
    onSuccess: invalidate,
  })
}

export function useConcludeAdminCustomerCaseMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiConcludeCustomerCasePayload) =>
      concludeAdminCustomerCaseApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useCloseAdminCustomerCaseMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiCloseCustomerCasePayload = {}) =>
      closeAdminCustomerCaseApi(caseId, payload),
    onSuccess: invalidate,
  })
}

export function useUpdateAdminCustomerCaseRefundMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: ({
      refundId,
      payload,
    }: {
      refundId: string
      payload: ApiUpdateCustomerCaseRefundPayload
    }) => updateAdminCustomerCaseRefundApi(caseId, refundId, payload),
    onSuccess: invalidate,
  })
}

export function useReopenAdminCustomerCaseMutation(caseId: string) {
  const invalidate = useInvalidateAdminCustomerCase(caseId)
  return useMutation({
    mutationFn: (payload: ApiReopenCustomerCasePayload) =>
      reopenAdminCustomerCaseApi(caseId, payload),
    onSuccess: invalidate,
  })
}
