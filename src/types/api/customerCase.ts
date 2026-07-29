export type CustomerCaseStatus =
  'SUBMITTED' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'RESOLVED' | 'CLOSED'

export type CustomerCasePriority = 'NORMAL' | 'HIGH' | 'CRITICAL'

export type CustomerCaseCategory =
  | 'VEHICLE_DAMAGE'
  | 'MISSING_PROPERTY'
  | 'SERVICE_QUALITY'
  | 'SERVICE_INCOMPLETE'
  | 'BILLING_PAYMENT'
  | 'STAFF_CONDUCT'
  | 'SAFETY_CONCERN'
  | 'OTHER'

export type CustomerCaseSlaState =
  'ON_TRACK' | 'FIRST_RESPONSE_OVERDUE' | 'RESOLUTION_OVERDUE' | 'BREACHED'

export type CustomerCaseLiabilityStatus =
  | 'UNDETERMINED'
  | 'GARAGE_RESPONSIBLE'
  | 'PRE_EXISTING_DAMAGE'
  | 'CUSTOMER_OR_THIRD_PARTY'
  | 'INCONCLUSIVE'

export type CustomerCaseResolutionStatus =
  | 'PROPOSED'
  | 'CUSTOMER_ACCEPTED'
  | 'CUSTOMER_REJECTED'
  | 'APPLIED'
  | 'FAILED'
  | 'SUPERSEDED'

export type CustomerCaseResolutionActionType =
  | 'REFUND'
  | 'VOUCHER'
  | 'REWORK'
  | 'WAIVE_CHARGE'
  | 'NO_COMPENSATION'

export type CustomerCaseRefundMethod =
  | 'ORIGINAL_PAYMENT'
  | 'CASH'
  | 'BANK_TRANSFER'

export type CustomerCaseRefundStatus =
  'APPROVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type CustomerCaseVoucherType =
  'FIXED_AMOUNT' | 'PERCENTAGE' | 'FREE_SERVICE'

export interface ApiCustomerCaseUserSummary {
  id: string
  full_name: string
  role: string
  phone?: string | null
}

export interface ApiCustomerCaseTimelineEvent {
  id: string
  case_id: string
  event_type: string
  actor_id?: string | null
  actor?: ApiCustomerCaseUserSummary | null
  actor_role?: string | null
  from_status?: CustomerCaseStatus | null
  to_status?: CustomerCaseStatus | null
  visible_to_customer?: boolean
  metadata?: Record<string, unknown>
  created_at?: string
}

export interface ApiCustomerCaseEvidence {
  id: string
  url?: string
  mime_type?: string
  size?: number
  purpose?: string
  owner_id?: string | null
  created_at?: string
}

export interface ApiCustomerCaseMessage {
  id: string
  case_id: string
  sender_id?: string | null
  sender?: ApiCustomerCaseUserSummary | null
  sender_role: string
  message: string
  evidence?: ApiCustomerCaseEvidence[]
  created_at?: string
}

export interface ApiCustomerCase {
  id: string
  case_code?: string | null
  booking_id?: string | null
  handover_id?: string | null
  garage_id?: string | null
  customer_id?: string | null
  customer?: ApiCustomerCaseUserSummary | null
  vehicle_id?: string | null
  is_walk_in_case: boolean
  reporter_name?: string | null
  reporter_phone?: string | null
  created_by_staff_id?: string | null
  category: CustomerCaseCategory
  priority: CustomerCasePriority
  source: 'HANDOVER' | 'AFTER_HANDOVER'
  status: CustomerCaseStatus
  description: string
  damage_location?: string | null
  desired_resolution?: string | null
  discovered_at?: string | null
  vehicle_received?: boolean
  evidence?: ApiCustomerCaseEvidence[]
  booking_snapshot?: Record<string, unknown>
  inspection_snapshot?: Record<string, unknown>
  assigned_to_id?: string | null
  assigned_to?: ApiCustomerCaseUserSummary | null
  assigned_by_id?: string | null
  assigned_at?: string | null
  acknowledged_by_id?: string | null
  acknowledged_at?: string | null
  first_response_due_at?: string | null
  resolution_due_at?: string | null
  first_response_breached_at?: string | null
  resolution_breached_at?: string | null
  escalation_level?: number
  reopen_count?: number
  last_reopened_at?: string | null
  last_reopen_reason?: string | null
  liability_status?: CustomerCaseLiabilityStatus | null
  conclusion?: string | null
  resolution_summary?: string | null
  resolved_by_id?: string | null
  resolved_at?: string | null
  closed_by_id?: string | null
  closed_at?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiTechnicalAssessment {
  id: string
  case_id: string
  garage_id: string
  inspector_staff_profile_id?: string | null
  inspector_user_id?: string | null
  assigned_by_id?: string | null
  assigned_at?: string | null
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED'
  started_at?: string | null
  submitted_at?: string | null
  findings?: string | null
  root_cause?: string | null
  severity?: 'MINOR' | 'MODERATE' | 'MAJOR' | 'SAFETY_CRITICAL' | null
  recommended_resolution?: string | null
  evidence?: ApiCustomerCaseEvidence[]
}

export interface ApiCustomerCaseResolutionAction {
  id?: string
  action_type: CustomerCaseResolutionActionType
  amount?: number | null
  refund_method?: CustomerCaseRefundMethod | null
  voucher_type?: CustomerCaseVoucherType | null
  value?: number | null
  max_discount_amount?: number | null
  min_order_amount?: number | null
  service_package_id?: string | null
  expires_at?: string | null
  rework_start_time?: string | null
  note?: string | null
}

export interface ApiCustomerCaseResolution {
  id: string
  case_id: string
  version: number
  status: CustomerCaseResolutionStatus
  summary: string
  actions: ApiCustomerCaseResolutionAction[]
  proposed_by_id: string
  proposed_at: string
  customer_responded_by_id?: string | null
  customer_response_note?: string | null
  customer_responded_at?: string | null
  applied_by_id?: string | null
  applied_at?: string | null
  failure_reason?: string | null
  refund_ids: string[]
  voucher_ids: string[]
  rework_booking_ids: string[]
  created_at?: string
  updated_at?: string
}

export interface ApiCustomerCaseRefund {
  id: string
  case_id: string
  resolution_id: string
  booking_id: string
  amount: number
  method: CustomerCaseRefundMethod
  status: CustomerCaseRefundStatus
  approved_by_id: string
  approved_at: string
  processed_by_id?: string | null
  processed_at?: string | null
  transaction_reference?: string | null
  note?: string | null
  failure_reason?: string | null
  created_at?: string
  updated_at?: string
}

export interface ApiCustomerCaseDetail {
  case: ApiCustomerCase
  messages: ApiCustomerCaseMessage[]
  timeline: ApiCustomerCaseTimelineEvent[]
  technical_assessment?: ApiTechnicalAssessment | null
  resolutions: ApiCustomerCaseResolution[]
  refunds: ApiCustomerCaseRefund[]
}

export interface ApiCustomerCaseListMeta {
  page: number
  limit: number
  total: number
  total_pages: number
}

export interface ApiCustomerCaseListParams {
  page?: number
  limit?: number
  status?: CustomerCaseStatus
  category?: CustomerCaseCategory
  priority?: CustomerCasePriority
  booking_id?: string
  case_code?: string
  assigned_to_id?: string
  garage_id?: string
}

export interface ApiAcknowledgeCustomerCasePayload {
  note?: string
}

export interface ApiAssignCustomerCasePayload {
  staff_profile_id: string
}

export interface ApiAddCaseEvidencePayload {
  upload_ids: string[]
}

export interface ApiSendCaseMessagePayload {
  message: string
  upload_ids?: string[]
}

export interface ApiCustomerCaseSlaSummary {
  total: number
  by_sla_state: Partial<Record<CustomerCaseSlaState, number>>
  by_priority: Partial<Record<CustomerCasePriority, number>>
  by_status: Partial<Record<CustomerCaseStatus, number>>
}

export interface ApiCustomerCaseSlaRow {
  id: string
  case_code: string
  garage_id: string
  status: CustomerCaseStatus
  priority: CustomerCasePriority
  sla_state: CustomerCaseSlaState
  first_response_due_at?: string | null
  resolution_due_at?: string | null
  escalation_level: number
  assigned_to_id?: string | null
}

export interface ApiCustomerCaseSlaDashboard {
  summary: ApiCustomerCaseSlaSummary
  cases: ApiCustomerCaseSlaRow[]
}

export interface ApiCreateWalkInCasePayload {
  booking_id: string
  category: CustomerCaseCategory
  description: string
  damage_location?: string
  desired_resolution?: string
  discovered_at?: string
  vehicle_received?: boolean
  upload_ids?: string[]
}

export interface ApiRecordWalkInResolutionPayload {
  resolution_id: string
  accepted: boolean
  note?: string
}

export interface ApiAssignTechnicalAssessmentPayload {
  staff_profile_id: string
}

export interface ApiSubmitTechnicalAssessmentPayload {
  findings: string
  root_cause: string
  severity: 'MINOR' | 'MODERATE' | 'MAJOR' | 'SAFETY_CRITICAL'
  recommended_resolution: string
  upload_ids?: string[]
}

export interface ApiConcludeCustomerCasePayload {
  liability_status: Exclude<
    CustomerCaseLiabilityStatus,
    'UNDETERMINED'
  >
  conclusion: string
  resolution_summary?: string
}

export interface ApiCloseCustomerCasePayload {
  note?: string
}

export interface ApiProposeCustomerCaseResolutionPayload {
  summary: string
  actions: ApiCustomerCaseResolutionAction[]
}

export interface ApiUpdateCustomerCaseRefundPayload {
  status: Exclude<CustomerCaseRefundStatus, 'APPROVED'>
  transaction_reference?: string
  note?: string
  failure_reason?: string
}

export interface ApiReopenCustomerCasePayload {
  reason: string
}
