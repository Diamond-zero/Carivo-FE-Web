import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAdminResearchReportApi,
  deleteAdminResearchReportApi,
  getAdminResearchReportByIdApi,
  getAdminResearchReportsApi,
  retryAdminResearchReportApi,
  runAdminResearchReportApi,
  updateAdminResearchReportApi,
  type ResearchListParams,
  type ResearchReportCreatePayload,
} from '../../../api/survey.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'

export function useAdminResearchReports(params?: ResearchListParams) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: adminQueryKeys.researchReports(params),
    queryFn: async () => {
      const result = await getAdminResearchReportsApi(params)
      return {
        reports: result.reports,
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useAdminResearchReport(reportId?: string) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: adminQueryKeys.researchReport(reportId ?? ''),
    queryFn: async () => getAdminResearchReportByIdApi(reportId!),
    enabled: isAuthenticated && Boolean(reportId),
    staleTime: 30_000,
  })
}

export function useAdminResearchReportMutations() {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.researchReports() })

  const createMutation = useMutation({
    mutationFn: (payload: ResearchReportCreatePayload) =>
      createAdminResearchReportApi(payload),
    onSuccess: () => void invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: ({
      reportId,
      payload,
    }: {
      reportId: string
      payload: ResearchReportCreatePayload
    }) => updateAdminResearchReportApi(reportId, payload),
    onSuccess: () => void invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (reportId: string) => deleteAdminResearchReportApi(reportId),
    onSuccess: () => void invalidate(),
  })

  const runMutation = useMutation({
    mutationFn: (reportId: string) => runAdminResearchReportApi(reportId),
    onSuccess: () => void invalidate(),
  })

  const retryMutation = useMutation({
    mutationFn: (reportId: string) => retryAdminResearchReportApi(reportId),
    onSuccess: () => void invalidate(),
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    runMutation,
    retryMutation,
  }
}