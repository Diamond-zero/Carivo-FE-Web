import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeAdminSurveyApi,
  createAdminSurveyApi,
  deleteAdminSurveyApi,
  getAdminSurveyResponsesApi,
  getAdminSurveysApi,
  publishAdminSurveyApi,
  updateAdminSurveyApi,
  type SurveyCreatePayload,
  type SurveyListParams,
  type SurveyUpdatePayload,
} from '../../../api/survey.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiSurveyResponse } from '../../../lib/mappers/adminMappers'
import { adminQueryKeys } from './queryKeys'

export function useAdminSurveys(params?: SurveyListParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.surveys(params),
    queryFn: async () => {
      const result = await getAdminSurveysApi(params)
      return {
        surveys: result.surveys,
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useAdminSurveyResponses(surveyId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.surveyResponses(surveyId ?? ''),
    queryFn: async () => {
      const result = await getAdminSurveyResponsesApi(surveyId!)
      return {
        responses: result.responses.map(mapApiSurveyResponse),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated && Boolean(surveyId),
  })
}

export function useAdminSurveyMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.surveys() })

  const createMutation = useMutation({
    mutationFn: (payload: SurveyCreatePayload) => createAdminSurveyApi(payload),
    onSuccess: () => void invalidate(),
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      surveyId,
      payload,
    }: {
      surveyId: string
      payload: SurveyUpdatePayload
    }) => updateAdminSurveyApi(surveyId, payload),
    onSuccess: () => void invalidate(),
  })

  const deleteMutation = useMutation({
    mutationFn: (surveyId: string) => deleteAdminSurveyApi(surveyId),
    onSuccess: () => void invalidate(),
  })

  const publishMutation = useMutation({
    mutationFn: (surveyId: string) => publishAdminSurveyApi(surveyId),
    onSuccess: () => void invalidate(),
  })

  const closeMutation = useMutation({
    mutationFn: (surveyId: string) => closeAdminSurveyApi(surveyId),
    onSuccess: () => void invalidate(),
  })

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    publishMutation,
    closeMutation,
  }
}

export const SURVEY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đang mở',
  CLOSED: 'Đã đóng',
}
