import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getAdminFeedbackRewardAnalyticsApi,
  getAdminFeedbackRewardRuleApi,
  updateAdminFeedbackRewardRuleApi,
} from '../../../api/feedbackReward.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import type {
  FeedbackRewardAnalyticsParams,
  FeedbackRewardRuleUpdatePayload,
} from '../../../types/feedbackReward'
import { adminQueryKeys } from './queryKeys'

export function useAdminFeedbackRewardRule() {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.feedbackRewardRule(),
    queryFn: getAdminFeedbackRewardRuleApi,
    enabled: isAuthenticated,
  })
}

export function useAdminFeedbackRewardAnalytics(
  params?: FeedbackRewardAnalyticsParams,
) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.feedbackRewardAnalytics(params),
    queryFn: () => getAdminFeedbackRewardAnalyticsApi(params),
    enabled: isAuthenticated,
  })
}

export function useUpdateAdminFeedbackRewardRule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: FeedbackRewardRuleUpdatePayload) =>
      updateAdminFeedbackRewardRuleApi(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.feedbackRewardRule(),
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'feedback-reward-analytics'],
        exact: false,
      })
    },
  })
}
