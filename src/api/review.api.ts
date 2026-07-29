import type { ApiGarage, ApiResponse } from '../types/api'
import type { ApiListResponse } from '../types/api/admin'
import type {
  AdminReviewListParams,
  PublicReviewShowcase,
  Review,
  ReviewAnalytics,
  ReviewAnalyticsParams,
  ReviewListParams,
  ReviewListResponse,
  ReviewModerationPayload,
} from '../types/review'
import { apiClient } from './client'

function mapReviewListResponse(data: ApiListResponse<Review[]>): ReviewListResponse {
  return {
    reviews: data.data,
    meta: {
      page: data.meta?.page ?? 1,
      limit: data.meta?.limit ?? 20,
      total: data.meta?.total ?? data.data.length,
      total_pages: data.meta?.total_pages ?? 1,
    },
  }
}

export async function listPublicGarageReviewsApi(
  garageId: string,
  params: {
    page?: number
    limit?: number
    rating?: number
    has_comment?: boolean
    sort?: 'NEWEST' | 'OLDEST' | 'HIGHEST' | 'LOWEST'
  } = {},
) {
  const { data } = await apiClient.get<ApiListResponse<Review[]>>(
    `/garages/${garageId}/reviews`,
    { params },
  )
  return mapReviewListResponse(data)
}

export async function getPublicReviewShowcaseApi(): Promise<PublicReviewShowcase> {
  const { data } = await apiClient.get<ApiListResponse<ApiGarage[]>>('/garages', {
    params: { page: 1, limit: 12 },
  })
  const garages = data.data
    .filter((garage) => (garage.rating_count ?? 0) > 0)
    .sort((left, right) => (right.rating_count ?? 0) - (left.rating_count ?? 0))
    .slice(0, 6)

  const lists = await Promise.all(
    garages.map((garage) =>
      listPublicGarageReviewsApi(garage.id, {
        page: 1,
        limit: 2,
        has_comment: true,
        sort: 'NEWEST',
      }),
    ),
  )
  const reviews = lists
    .flatMap((result) => result.reviews)
    .sort(
      (left, right) =>
        new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
    )
    .slice(0, 6)
  const ratingCount = garages.reduce(
    (total, garage) => total + (garage.rating_count ?? 0),
    0,
  )
  const weightedRating = garages.reduce(
    (total, garage) =>
      total + (garage.rating_average ?? 0) * (garage.rating_count ?? 0),
    0,
  )

  return {
    reviews,
    rating_count: ratingCount,
    rating_average:
      ratingCount > 0 ? Math.round((weightedRating / ratingCount) * 10) / 10 : 0,
  }
}

export async function listStaffReviewsApi(params: ReviewListParams = {}) {
  const { data } = await apiClient.get<ApiListResponse<Review[]>>(
    '/staff/reviews',
    { params },
  )
  return mapReviewListResponse(data)
}

export async function replyStaffReviewApi(reviewId: string, content: string) {
  const { data } = await apiClient.put<ApiResponse<Review>>(
    `/staff/reviews/${reviewId}/reply`,
    { content },
  )
  return data.data
}

export async function deleteStaffReviewReplyApi(reviewId: string) {
  const { data } = await apiClient.delete<ApiResponse<Review>>(
    `/staff/reviews/${reviewId}/reply`,
  )
  return data.data
}

export async function listAdminReviewsApi(
  params: AdminReviewListParams = {},
) {
  const { data } = await apiClient.get<ApiListResponse<Review[]>>(
    '/admin/reviews',
    { params },
  )
  return mapReviewListResponse(data)
}

export async function getAdminReviewAnalyticsApi(
  params: ReviewAnalyticsParams = {},
) {
  const { data } = await apiClient.get<ApiResponse<ReviewAnalytics>>(
    '/admin/reviews/analytics',
    { params },
  )
  return data.data
}

export async function moderateAdminReviewApi(
  reviewId: string,
  payload: ReviewModerationPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<Review>>(
    `/admin/reviews/${reviewId}/moderation`,
    payload,
  )
  return data.data
}
