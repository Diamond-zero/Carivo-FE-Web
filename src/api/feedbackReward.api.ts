import type { ApiResponse } from '../types/api'
import type {
  FeedbackRewardAnalytics,
  FeedbackRewardAnalyticsParams,
  FeedbackRewardRule,
  FeedbackRewardRuleUpdatePayload,
} from '../types/feedbackReward'
import { apiClient } from './client'

export async function getAdminFeedbackRewardRuleApi() {
  const { data } = await apiClient.get<ApiResponse<FeedbackRewardRule>>(
    '/admin/feedback-rewards/rule',
  )
  return data.data
}

export async function updateAdminFeedbackRewardRuleApi(
  payload: FeedbackRewardRuleUpdatePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<FeedbackRewardRule>>(
    '/admin/feedback-rewards/rule',
    payload,
  )
  return data.data
}

export async function getAdminFeedbackRewardAnalyticsApi(
  params?: FeedbackRewardAnalyticsParams,
) {
  const { data } = await apiClient.get<ApiResponse<FeedbackRewardAnalytics>>(
    '/admin/feedback-rewards/analytics',
    { params },
  )
  return data.data
}
