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
  meta?: ApiPaginationMeta
}

export interface ApiPromotion {
  id: string
  code: string
  name: string
  description?: string | null
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'
  discount_value: number
  max_discount_amount?: number | null
  min_order_amount: number
  audience?: string
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
  tier_history?: Array<{
    id: string
    from_tier?: string | null
    to_tier: string
    reason?: string
    created_at: string
  }>
  point_transactions?: Array<{
    id: string
    type: string
    points: number
    balance_after: number
    description?: string
    created_at: string
  }>
}

export interface ApiSurvey {
  id: string
  title: string
  description?: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  questions?: Array<{
    id: string
    text: string
    type: string
    is_required?: boolean
    options?: string[]
    order?: number
  }>
  garage_id?: string | null
  garage?: { id: string; name: string } | null
  response_count?: number
  published_at?: string | null
  closed_at?: string | null
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
  filters?: Record<string, unknown>
  result?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
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

export interface ApiSurveyResponse {
  id: string
  survey_id: string
  customer_id?: string | null
  customer?: { id: string; full_name: string } | null
  booking_id?: string | null
  answers?: Array<{
    question_id: string
    value: unknown
  }>
  submitted_at?: string
  created_at?: string
}

export interface ApiVehicle {
  id: string
  customer_id: string
  raw_license_plate: string
  normalized_license_plate?: string
  vehicle_type: 'MOTORBIKE' | 'CAR'
  brand?: string | null
  model?: string | null
  color?: string | null
  is_active: boolean
}
