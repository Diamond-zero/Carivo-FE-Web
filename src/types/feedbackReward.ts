export interface FeedbackRewardRule {
  id: string
  rule_code: string
  survey_points: number
  review_points: number
  max_points_per_booking: number
  review_window_days: number
  reminder_after_hours: number
  count_toward_tier: boolean
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  created_at?: string
  updated_at?: string
}

export interface FeedbackInvitationMetric {
  total: number
  opened: number
  open_rate: number
}

export interface FeedbackRewardAnalytics {
  period: {
    from: string | null
    to: string | null
  }
  rule: FeedbackRewardRule
  invitations: FeedbackInvitationMetric & {
    survey: FeedbackInvitationMetric
    review: FeedbackInvitationMetric
  }
  completions: {
    survey_responses: number
    reviews: number
    survey_rate: number
    review_rate: number
  }
  rewards: {
    survey_count: number
    survey_points: number
    review_count: number
    review_points: number
    unique_customers: number
    total_points: number
    remaining_points: number
    consumed_points_estimate: number
    estimated_value_amount: number
    estimated_cost_per_feedback: number
  }
  quality: {
    hidden_reviews: number
    spam_reviews: number
    nps_response_count: number
    nps_score: number | null
    average_garage_rating: number | null
    average_service_rating: number | null
  }
}

export interface FeedbackRewardRuleUpdatePayload {
  survey_points?: number
  review_points?: number
  review_window_days?: number
  reminder_after_hours?: number
  count_toward_tier?: boolean
  is_active?: boolean
  starts_at?: string | null
  ends_at?: string | null
}

export interface FeedbackRewardAnalyticsParams {
  from?: string
  to?: string
}
