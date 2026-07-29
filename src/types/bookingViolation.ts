export type BookingViolationRiskStatus =
  | 'NORMAL'
  | 'WARNING'
  | 'DEPOSIT_REQUIRED'
  | 'BLOCKED'

export type BookingViolationAppealStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'

export interface BookingViolationCustomer {
  id: string
  full_name: string
  phone: string | null
  email: string | null
  avatar_url: string | null
  is_active: boolean
}

export interface BookingViolationStatus {
  customer_id: string | null
  customer: BookingViolationCustomer | null
  violation_score: number
  risk_status: BookingViolationRiskStatus
  warning_required: boolean
  deposit_required: boolean
  booking_blocked: boolean
  booking_blocked_until: string | null
  booking_block_count: number
  last_violation_at: string | null
  last_event_at: string | null
  last_recovery_at: string | null
  thresholds: {
    warning: number
    deposit_required: number
    blocked: number
  }
}

export interface BookingViolationHistory {
  id: string
  source: 'BOOKING_EVENT' | 'ADJUSTMENT'
  booking_id?: string | null
  booking_code?: string | null
  event: string
  score_change: number
  score_before: number
  score_after: number
  reason: string | null
  is_reversed?: boolean
  reversal_reason?: string | null
  created_at: string
}

export interface BookingViolationAppeal {
  id: string
  customer_id: string
  customer: BookingViolationCustomer | null
  event: BookingViolationHistory | null
  reason: string
  status: BookingViolationAppealStatus
  admin_note: string | null
  reviewed_by: BookingViolationCustomer | null
  reviewed_at: string | null
  resolution_score_change: number
  created_at: string
  updated_at: string
}

export interface BookingViolationDetail {
  status: BookingViolationStatus
  history: BookingViolationHistory[]
  history_meta: PaginationMeta
  appeals: BookingViolationAppeal[]
}

export interface PaginationMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface BookingViolationListParams {
  page?: number
  limit?: number
  risk_status?: BookingViolationRiskStatus
  search?: string
}

export interface BookingViolationAppealListParams {
  page?: number
  limit?: number
  status?: BookingViolationAppealStatus
}
