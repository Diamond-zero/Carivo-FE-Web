export interface ApiPaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiListResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: ApiPaginationMeta | (ApiPaginationMeta & Record<string, unknown>)
}

export type ApiPromotionAudience = 'ALL' | 'CUSTOMER' | 'WALK_IN' | string

export interface ApiPromotion {
  id: string
  code: string
  name: string
  description?: string | null
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: number
  max_discount_amount?: number | null
  min_order_amount: number
  audience?: ApiPromotionAudience
  phone_required?: boolean
  per_phone_limit?: number | null
  applicable_tiers?: string[]
  applicable_vehicle_types?: string[]
  applicable_service_package_ids?: string[]
  start_at: string
  end_at: string
  usage_limit?: number | null
  per_customer_limit?: number | null
  used_count?: number
  reserved_count?: number
  is_active: boolean
  created_by_id?: string | null
  updated_by_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiTierRule {
  id: string
  tier_name: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  booking_window_days: number
  max_upcoming_bookings: number
  point_multiplier: number
  priority_level: number
  min_total_spent: number
  min_total_visits: number
  min_total_points?: number
  is_active: boolean
  created_at?: string
  updated_at?: string
}

export interface ApiAuditLog {
  id: string
  actor_id?: string | null
  actor?: {
    id: string
    full_name: string
    email?: string | null
    phone?: string | null
    role: string
    is_active: boolean
  } | null
  action: string
  resource_type: string
  resource_id: string
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  ip?: string | null
  user_agent?: string | null
  metadata?: Record<string, unknown>
  created_at: string
}

export interface ApiLoyaltyCustomer {
  id: string
  customer_id: string
  customer?: {
    id: string
    full_name: string
    email?: string | null
    phone?: string | null
    role: string
    is_active: boolean
  } | null
  current_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM'
  total_points: number
  available_points: number
  redeemed_points: number
  expired_points: number
  total_spent: number
  total_visits: number
  last_visit_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiLoyaltyCustomerDetail extends ApiLoyaltyCustomer {
  current_tier_rule?: ApiTierRule | null
  next_tier_rule?: ApiTierRule | null
  tier_history?: Array<{
    id: string
    from_tier?: string | null
    to_tier: string
    reason?: string
    created_at: string
  }>
  point_transactions?: Array<{
    id: string
    type: 'EARN' | 'REDEEM' | 'REFUND' | 'EXPIRE' | 'ADJUST'
    points: number
    balance_after: number
    description?: string
    booking_id?: string | null
    created_at: string
  }>
}

export type ApiSurveyQuestionType =
  | 'RATING'
  | 'NPS'
  | 'SINGLE_CHOICE'
  | 'MULTI_CHOICE'
  | 'TEXT'

export interface ApiSurveyQuestion {
  id?: string
  text: string
  type: ApiSurveyQuestionType
  is_required?: boolean
  options?: string[]
  order: number
}

export interface ApiSurvey {
  id: string
  title: string
  description?: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  questions?: ApiSurveyQuestion[]
  response_window_days?: number
  response_expires_at?: string | null
  booking_id?: string | null
  wash_history_id?: string | null
  garage_id?: string | null
  garage?: { id: string; name: string } | null
  created_by_id?: string
  created_by?: Record<string, unknown> | null
  published_at?: string | null
  closed_at?: string | null
  response_count?: number
  created_at?: string
  updated_at?: string
}

export interface ApiSurveyResponseAnswer {
  question_id: string
  question_text?: string
  question_type?: ApiSurveyQuestionType
  numeric_value?: number | null
  text_value?: string | null
  selected_options?: string[]
}

export interface ApiSurveyResponse {
  id: string
  survey_id: string
  survey?: ApiSurvey
  booking_id: string
  wash_history_id?: string
  customer_id?: string
  customer?: Record<string, unknown> | null
  answers: ApiSurveyResponseAnswer[]
  upload_ids?: string[]
  uploads?: Array<{
    id: string
    url: string
    public_id?: string
    mime_type?: string
  }>
  submitted_at: string
  created_at?: string
  updated_at?: string
}

export interface ApiAnalyticsParams {
  from?: string
  to?: string
  garage_id?: string
  service_package_id?: string
  vehicle_type?: 'MOTORBIKE' | 'CAR'
  group_by?: 'DAY' | 'WEEK' | 'MONTH'
}

export interface ApiResearchReport {
  id: string
  title: string
  objective?: string
  type: string
  status: 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  filters?: ApiResearchFilters | Record<string, unknown>
  result?: Record<string, unknown> | null
  data_snapshot?: Record<string, unknown> | null
  model?: string | null
  prompt_version?: string | null
  usage_metadata?: Record<string, unknown> | null
  error?: Record<string, unknown> | null
  created_by_id?: string
  created_by?: Record<string, unknown> | null
  started_at?: string | null
  completed_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiResearchFilters {
  survey_id: string
  from?: string | null
  to?: string | null
  garage_id?: string | null
  service_package_id?: string | null
  vehicle_type?: 'MOTORBIKE' | 'CAR' | null
  group_by?: 'DAY' | 'WEEK' | 'MONTH'
}

export type ApiNotificationType =
  | 'AUTH_REGISTER_SUCCESS'
  | 'AUTH_PASSWORD_RESET_REQUESTED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REMINDER'
  | 'BOOKING_CANCELED'
  | 'WAITLIST_JOINED'
  | 'WAITLIST_OFFERED'
  | 'WAITLIST_OFFER_ACCEPTED'
  | 'WAITLIST_OFFER_EXPIRED'
  | 'WAITLIST_CANCELED'
  | 'CHECKED_IN'
  | 'SERVICE_STARTED'
  | 'SERVICE_STEP_DONE'
  | 'SERVICE_COMPLETED'
  | 'PAYMENT_CONFIRMED'
  | 'REWARD_EARNED'
  | 'POINTS_EXPIRING'
  | 'TIER_UPGRADED'
  | 'TIER_DOWNGRADED'
  | 'PROMOTION_AVAILABLE'
  | 'SURVEY_REQUEST'

export type ApiNotificationChannel = 'IN_APP' | 'EMAIL'
export type ApiNotificationRelatedType =
  | 'AUTH'
  | 'BOOKING'
  | 'WAITLIST'
  | 'LOYALTY'
  | 'PROMOTION'
  | 'SURVEY'

export interface ApiNotification {
  id: string
  user_id?: string | null
  recipient_email?: string | null
  type: ApiNotificationType
  title: string
  message: string
  channels: ApiNotificationChannel[]
  related_type: ApiNotificationRelatedType
  related_id?: string
  in_app_status: 'UNREAD' | 'READ'
  read_at?: string | null
  email_status: 'NOT_REQUIRED' | 'PENDING' | 'SENT' | 'FAILED'
  email_sent_at?: string | null
  email_failed_reason?: string | null
  metadata?: Record<string, unknown>
  created_at: string
  updated_at?: string
}

export interface ApiNotificationMeta extends ApiPaginationMeta {
  unread_count?: number
}

export interface ApiWaitlist {
  id: string
  customer_id: string
  customer?: {
    id: string
    full_name: string
    phone?: string | null
  } | null
  vehicle_id: string
  vehicle?: {
    id: string
    raw_license_plate?: string
    vehicle_type?: string
  } | null
  garage_id: string
  garage?: { id: string; name: string } | null
  service_package_id: string
  service_package?: { id: string; name: string } | null
  vehicle_type: 'MOTORBIKE' | 'CAR'
  desired_start_time: string
  status: 'WAITING' | 'OFFERED' | 'ACCEPTED' | 'CANCELED' | 'EXPIRED'
  offered_at?: string | null
  offer_expires_at?: string | null
  accepted_at?: string | null
  canceled_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiExpiringPoint {
  id: string
  customer_id: string
  customer?: {
    id: string
    full_name: string
    phone?: string | null
  } | null
  points: number
  expires_at: string
  status?: string
  created_at?: string
}

export type ApiPointTransactionType =
  | 'EARN'
  | 'REDEEM'
  | 'REFUND'
  | 'EXPIRE'
  | 'ADJUST'

export interface ApiPointTransaction {
  id: string
  customer_id: string
  customer?: {
    id: string
    full_name: string
    email?: string | null
    phone?: string | null
    role?: string
    is_active?: boolean
  } | null
  booking_id?: string | null
  type: ApiPointTransactionType
  points: number
  remaining_points?: number
  balance_before?: number
  balance_after: number
  description?: string | null
  earned_at?: string | null
  expires_at?: string | null
  expired_at?: string | null
  source_transaction_ids?: string[]
  created_by?: string | null
  created_at: string
  updated_at?: string
}

export interface ApiSurveyResponse { /* moved up - see ApiSurveyResponse export below */ }

export type ApiVehicleEngineType = 'GASOLINE' | 'ELECTRIC'
export type ApiMotorbikeCcGroup = 'UNDER_175CC' | 'OVER_175CC'
export type ApiCarBodyType =
  | 'HATCHBACK'
  | 'SEDAN'
  | 'SUV'
  | 'MPV'
  | 'PICKUP'
  | 'VAN'

export interface ApiVehicle {
  id: string
  customer_id: string
  raw_license_plate: string
  normalized_license_plate?: string
  vehicle_type: 'MOTORBIKE' | 'CAR'
  engine_type?: ApiVehicleEngineType
  motorbike_cc_group?: ApiMotorbikeCcGroup | null
  car_body_type?: ApiCarBodyType | null
  seat_count?: number | null
  brand?: string | null
  model?: string | null
  color?: string | null
  is_default?: boolean
  is_active: boolean
  created_at?: string
  updated_at?: string
}
