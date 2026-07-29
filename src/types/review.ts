import type { ApiPaginationMeta } from './api/admin'

export type ReviewModerationStatus = 'PUBLISHED' | 'HIDDEN'
export type ReviewModerationReason =
  | 'INAPPROPRIATE_LANGUAGE'
  | 'PERSONAL_INFORMATION'
  | 'SPAM'
  | 'OFF_TOPIC'
  | 'FRAUD'
  | 'OTHER'

export interface ReviewCustomer {
  id: string | null
  full_name: string
  avatar_url: string | null
  email?: string | null
  phone?: string | null
}

export interface ReviewGarage {
  id: string
  name: string | null
  garage_code: string | null
  address?: string | null
  city?: string | null
}

export interface ReviewServicePackage {
  id: string
  name: string | null
  service_code: string | null
  vehicle_type?: string | null
  service_type?: string | null
}

export interface ReviewUpload {
  id: string
  url: string
  mime_type?: string | null
  width?: number | null
  height?: number | null
}

export interface ReviewGarageReply {
  content: string
  replied_by_id?: string
  replied_by?: {
    id?: string
    full_name: string
    avatar_url?: string | null
    role?: string | null
  } | null
  replied_at: string
  updated_at: string
}

export interface Review {
  id: string
  booking_id?: string
  wash_history_id?: string
  customer_id?: string
  customer: ReviewCustomer | null
  garage_id: string
  garage: ReviewGarage
  service_package_id: string
  service_package: ReviewServicePackage
  garage_rating: number
  service_rating: number
  rating: number
  comment: string | null
  upload_ids?: string[]
  uploads: ReviewUpload[]
  is_anonymous: boolean
  moderation_status?: ReviewModerationStatus
  moderation_reason?: ReviewModerationReason | null
  moderation_note?: string | null
  moderated_by_id?: string | null
  moderated_by?: {
    id: string
    full_name: string
    avatar_url?: string | null
    role?: string | null
  } | null
  moderated_at?: string | null
  garage_reply: ReviewGarageReply | null
  deleted_at?: string | null
  created_at: string
  updated_at: string
}

export interface ReviewListResponse {
  reviews: Review[]
  meta: ApiPaginationMeta
}

export interface ReviewListParams {
  page?: number
  limit?: number
  service_package_id?: string
  garage_rating?: number
  service_rating?: number
  moderation_status?: ReviewModerationStatus
  has_reply?: boolean
  from?: string
  to?: string
}

export interface AdminReviewListParams extends ReviewListParams {
  search?: string
  customer_id?: string
  booking_id?: string
  garage_id?: string
  is_anonymous?: boolean
}

export interface ReviewDistribution {
  1: number
  2: number
  3: number
  4: number
  5: number
}

export interface ReviewSummary {
  rating_average: number
  rating_count: number
  distribution: ReviewDistribution
}

export interface ReviewAnalyticsParams {
  garage_id?: string
  service_package_id?: string
  moderation_status?: ReviewModerationStatus
  from?: string
  to?: string
}

export interface ReviewAnalytics {
  total: number
  garage_rating_average: number
  service_rating_average: number
  replied_count: number
  response_rate: number
  low_rating_count: number
  garage_distribution: ReviewDistribution
  service_distribution: ReviewDistribution
  top_garages: Array<{
    garage_id: string
    garage_name: string | null
    garage_code: string | null
    rating_average: number
    rating_count: number
  }>
  top_services: Array<{
    service_package_id: string
    service_package_name: string | null
    service_code: string | null
    rating_average: number
    rating_count: number
  }>
}

export interface ReviewModerationPayload {
  status: ReviewModerationStatus
  reason?: ReviewModerationReason | null
  note?: string | null
}

export interface PublicReviewShowcase {
  reviews: Review[]
  rating_average: number
  rating_count: number
}
