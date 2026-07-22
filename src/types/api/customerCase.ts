// ============================================================================
// Customer Case operations — Swagger [STAFF, ADMIN] Customer case operations
//
// 15 endpoints, chia làm 4 nhóm:
//   1. Garage-scoped case CRUD:
//      GET    /admin/customer-cases
//      GET    /admin/customer-cases/{id}
//      PATCH  /admin/customer-cases/{id}/acknowledge
//      PATCH  /admin/customer-cases/{id}/assign
//      POST   /admin/customer-cases/{id}/evidence
//      POST   /admin/customer-cases/{id}/messages
//   2. SLA dashboard:
//      GET    /staff/customer-cases/sla-dashboard
//   3. Walk-in OTP / case creation:
//      POST   /staff/customer-cases/walk-in/otp/request
//      POST   /staff/customer-cases/walk-in/otp/verify
//      POST   /staff/customer-cases/walk-in
//      PATCH  /staff/customer-cases/{id}/walk-in-resolution-response
//   4. Technical assessment:
//      GET    /staff/customer-cases/{id}/technical-assessment
//      PATCH  /staff/customer-cases/{id}/technical-assessment/assign
//      PATCH  /staff/customer-cases/{id}/technical-assessment/start
//      POST   /staff/customer-cases/{id}/technical-assessment/submit
// ============================================================================

export type CustomerCaseStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'IN_REVIEW'
  | 'TECHNICAL_ASSESSMENT'
  | 'AWAITING_CUSTOMER_RESPONSE'
  | 'RESOLVED'
  | 'CLOSED'
  | string

export type CustomerCasePriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string

export interface ApiCustomerCaseTimelineEvent {
  id: string
  type: string
  actor_id?: string | null
  actor_name?: string | null
  description?: string | null
  created_at?: string
}

export interface ApiCustomerCaseEvidence {
  id: string
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | string
  url: string
  caption?: string | null
  uploaded_by_id?: string | null
  uploaded_at?: string
}

export interface ApiCustomerCaseMessage {
  id: string
  sender_type: 'STAFF' | 'CUSTOMER' | 'SYSTEM' | string
  sender_id?: string | null
  sender_name?: string | null
  body: string
  visibility: 'CUSTOMER_VISIBLE' | 'INTERNAL' | string
  created_at?: string
}

export interface ApiCustomerCase {
  id: string
  case_code?: string | null
  customer_id?: string | null
  customer?: {
    id: string
    full_name: string
    phone?: string | null
  } | null
  booking_id?: string | null
  garage_id?: string | null
  category: string
  priority: CustomerCasePriority
  status: CustomerCaseStatus
  subject: string
  description?: string | null
  assigned_staff_id?: string | null
  assigned_staff_name?: string | null
  opened_at?: string | null
  acknowledged_at?: string | null
  resolved_at?: string | null
  closed_at?: string | null
  sla_due_at?: string | null
  /** Boolean FE derive — `sla_due_at < now` và status chưa RESOLVED. */
  sla_breached?: boolean
  source?: 'WALK_IN' | 'BOOKING' | 'CUSTOMER_APP' | string
  timeline?: ApiCustomerCaseTimelineEvent[]
  evidence?: ApiCustomerCaseEvidence[]
  messages?: ApiCustomerCaseMessage[]
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
  priority?: CustomerCasePriority
  assignee_id?: string
  garage_id?: string
  sla_status?: 'ON_TRACK' | 'AT_RISK' | 'BREACHED'
  from?: string
  to?: string
}

export interface ApiAcknowledgeCustomerCasePayload {
  self_assign?: boolean
  note?: string
}

export interface ApiAssignCustomerCasePayload {
  assigned_staff_id: string
  note?: string
}

export interface ApiAddCaseEvidencePayload {
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  url: string
  caption?: string
}

export interface ApiSendCaseMessagePayload {
  body: string
  visibility?: 'CUSTOMER_VISIBLE' | 'INTERNAL'
}

export interface ApiCustomerCaseSlaDashboard {
  total_open: number
  on_track: number
  at_risk: number
  breached: number
  by_priority: Record<string, number>
  by_status: Record<string, number>
  oldest_unresolved?: ApiCustomerCase | null
}

export interface ApiWalkInOtpRequestPayload {
  booking_id: string
}

export interface ApiWalkInOtpRequestResponse {
  challenge_id: string
  phone: string
  retry_after_seconds: number
  debug_otp?: string
}

export interface ApiWalkInOtpVerifyPayload {
  challenge_id: string
  otp: string
}

export interface ApiWalkInOtpVerifyResponse {
  verification_token: string
  phone: string
}

export interface ApiCreateWalkInCasePayload {
  verification_token: string
  category: string
  subject: string
  description?: string
  priority?: CustomerCasePriority
}

export interface ApiRecordWalkInResolutionPayload {
  resolution_decision: 'ACCEPTED' | 'REJECTED'
  customer_note?: string
}

export interface ApiTechnicalAssessment {
  id: string
  case_id: string
  assigned_inspector_id?: string | null
  assigned_inspector_name?: string | null
  status: 'PENDING_ASSIGN' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | string
  started_at?: string | null
  submitted_at?: string | null
  findings?: string | null
  recommendation?: string | null
  evidence_ids?: string[]
}

export interface ApiAssignTechnicalAssessmentPayload {
  assigned_inspector_id: string
}

export interface ApiStartTechnicalAssessmentPayload {
  note?: string
}

export interface ApiSubmitTechnicalAssessmentPayload {
  findings: string
  recommendation?: string
  evidence_ids: string[]
}