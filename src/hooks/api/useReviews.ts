import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteStaffReviewReplyApi,
  getAdminReviewAnalyticsApi,
  getPublicReviewShowcaseApi,
  listAdminReviewsApi,
  listStaffReviewsApi,
  moderateAdminReviewApi,
  replyStaffReviewApi,
} from '../../api/review.api'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useAuth } from '../../contexts/AuthContext'
import type {
  AdminReviewListParams,
  ReviewAnalyticsParams,
  ReviewListParams,
  ReviewModerationPayload,
} from '../../types/review'

const reviewQueryKeys = {
  publicShowcase: ['reviews', 'public', 'showcase'] as const,
  staff: ['reviews', 'staff'] as const,
  staffList: (params: ReviewListParams) =>
    ['reviews', 'staff', 'list', params] as const,
  admin: ['reviews', 'admin'] as const,
  adminList: (params: AdminReviewListParams) =>
    ['reviews', 'admin', 'list', params] as const,
  adminAnalytics: (params: ReviewAnalyticsParams) =>
    ['reviews', 'admin', 'analytics', params] as const,
}

export function usePublicReviewShowcase() {
  return useQuery({
    queryKey: reviewQueryKeys.publicShowcase,
    queryFn: getPublicReviewShowcaseApi,
    staleTime: 60_000,
    retry: 1,
  })
}

export function useStaffReviews(params: ReviewListParams) {
  const { isAuthenticated } = useAuth()

  return useQuery({
    queryKey: reviewQueryKeys.staffList(params),
    queryFn: () => listStaffReviewsApi(params),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  })
}

export function useReplyStaffReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      reviewId,
      content,
    }: {
      reviewId: string
      content: string
    }) => replyStaffReviewApi(reviewId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.staff })
    },
  })
}

export function useDeleteStaffReviewReply() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteStaffReviewReplyApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.staff })
    },
  })
}

export function useAdminReviews(params: AdminReviewListParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: reviewQueryKeys.adminList(params),
    queryFn: () => listAdminReviewsApi(params),
    enabled: isAuthenticated,
    placeholderData: (previousData) => previousData,
  })
}

export function useAdminReviewAnalytics(params: ReviewAnalyticsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: reviewQueryKeys.adminAnalytics(params),
    queryFn: () => getAdminReviewAnalyticsApi(params),
    enabled: isAuthenticated,
  })
}

export function useModerateAdminReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      reviewId,
      payload,
    }: {
      reviewId: string
      payload: ReviewModerationPayload
    }) => moderateAdminReviewApi(reviewId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reviewQueryKeys.admin })
      void queryClient.invalidateQueries({
        queryKey: reviewQueryKeys.publicShowcase,
      })
    },
  })
}
