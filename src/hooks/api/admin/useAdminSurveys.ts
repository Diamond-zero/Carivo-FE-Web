import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  closeAdminSurveyApi,
  getAdminSurveyResponsesApi,
  getAdminSurveysApi,
  publishAdminSurveyApi,
  type SurveyListParams,
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

  const publishMutation = useMutation({
    mutationFn: (surveyId: string) => publishAdminSurveyApi(surveyId),
    onSuccess: () => void invalidate(),
  })

  const closeMutation = useMutation({
    mutationFn: (surveyId: string) => closeAdminSurveyApi(surveyId),
    onSuccess: () => void invalidate(),
  })

  return { publishMutation, closeMutation }
}

export const SURVEY_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  PUBLISHED: 'Đang mở',
  CLOSED: 'Đã đóng',
}
