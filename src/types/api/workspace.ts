/**
 * Types cho Staff Workspace API - đồng bộ với BE:
 * GET /staff/workspace/bookings
 * GET /staff/workspace/bookings/:bookingId/workflow
 */

import type { ApiResponse } from './api'

/** Workflow phases theo BE định nghĩa */
export type WorkflowPhase =
  | 'WAITING_CHECK_IN'
  | 'WAITING_BEFORE_WASH_INSPECTION'
  | 'READY_FOR_SERVICE'
  | 'SERVICE_IN_PROGRESS'
  | 'WAITING_AFTER_WASH_INSPECTION'
  | 'READY_FOR_HANDOVER'
  | 'WAITING_CUSTOMER_ACCEPTANCE'
  | 'WAITING_PAYMENT'
  | 'READY_FOR_RELEASE'
  | 'HANDOVER_ON_HOLD'
  | 'RELEASED'
  | 'INCIDENT_HOLD'
  | 'CANCELED'
  | 'NO_SHOW'

/** Booking status trong workspace context */
export type WorkspaceBookingStatus =
  | 'CONFIRMED'
  | 'CHECKED_IN'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELED'
  | 'NO_SHOW'

/** Arrival status */
export type ArrivalStatus = 'ON_TIME' | 'EARLY' | 'LATE' | 'NOT_ARRIVED'

/** Payment status */
export type WorkspacePaymentStatus = 'UNPAID' | 'PENDING' | 'PAID'

/** Vehicle types */
export type VehicleType = 'CAR' | 'MOTORBIKE' | 'OTHER'

/** Available actions từ workflow API - dùng để quyết định hiển thị nút */
export type AvailableAction =
  | 'booking.cancel'
  | 'booking.mark_no_show'
  | 'booking.check_in'
  | 'inspection.before_wash.create'
  | 'booking.service.start'
  | 'service_item.pause'
  | 'service_item.resume'
  | 'service_item.complete_early'
  | 'service_item.confirm_complete'
  | 'booking.service.complete'

/** Một booking trong workspace list response */
export interface ApiWorkspaceBooking {
  booking_id: string
  garage_id: string
  customer_name: string | null
  customer_phone: string | null
  license_plate: string | null
  normalized_license_plate: string | null
  vehicle_type: VehicleType
  vehicle_brand: string | null
  vehicle_color: string | null
  start_time: string
  end_time: string
  wash_bay_id: string | null
  assigned_inspection_staff_id: string | null
  booking_status: WorkspaceBookingStatus
  arrival_status: ArrivalStatus | null
  workflow_phase: WorkflowPhase
  current_service_item_key: string | null
  payment_status: WorkspacePaymentStatus
  blocked_by_incident: boolean
  service_package_name: string | null
  final_price: number
  earned_points: number
}

/** Service item trong workflow detail */
export interface ApiServiceItem {
  key: string
  name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED' | 'PAUSED'
  current_step_key: string | null
  can_pause: boolean
  can_resume: boolean
  can_complete_early: boolean
  requires_confirmation: boolean
}

/** Service step trong workflow detail */
export interface ApiServiceStep {
  key: string
  name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED'
  automated: boolean
  wash_bay_id: string | null
}

/** Milestone trong workflow detail */
export interface ApiMilestone {
  key: string
  label: string
  status: 'PENDING' | 'DONE' | 'SKIPPED'
  completed_at: string | null
}

/** Blocker trong workflow detail */
export interface ApiWorkflowBlocker {
  type: 'INCIDENT' | 'PAYMENT' | 'INSPECTION' | 'ASSIGNMENT'
  message: string
  incident_id?: string
}

/** Workflow detail response */
export interface ApiWorkspaceWorkflow {
  booking_id: string
  garage_id: string
  license_plate: string
  vehicle_type: VehicleType
  start_time: string
  end_time: string
  wash_bay_id: string | null
  assigned_inspection_staff_id: string | null
  booking_status: WorkspaceBookingStatus
  arrival_status: ArrivalStatus | null
  workflow_phase: WorkflowPhase
  current_service_item_key: string | null
  payment_status: WorkspacePaymentStatus
  blocked_by_incident: boolean
  server_time: string
  milestones: ApiMilestone[]
  service_items: ApiServiceItem[]
  service_steps: ApiServiceStep[]
  blockers: ApiWorkflowBlocker[]
  available_actions: AvailableAction[]
}

/** Workspace bookings list response */
export interface ApiWorkspaceBookingsResponse {
  success: boolean
  message: string
  data: ApiWorkspaceBooking[]
  meta: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

/** Workspace workflow detail response */
export interface ApiWorkspaceWorkflowResponse {
  success: boolean
  message: string
  data: ApiWorkspaceWorkflow
}

/** Query params cho workspace bookings list */
export interface WorkspaceBookingsParams {
  page?: number
  limit?: number
  garage_id?: string
  status?: string
  from?: string
  to?: string
}

/** Label mapping cho workflow phases */
export const WORKFLOW_PHASE_LABELS: Record<WorkflowPhase, string> = {
  WAITING_CHECK_IN: 'Chờ check-in',
  WAITING_BEFORE_WASH_INSPECTION: 'Chờ kiểm tra trước rửa',
  READY_FOR_SERVICE: 'Sẵn sàng dịch vụ',
  SERVICE_IN_PROGRESS: 'Đang rửa xe',
  WAITING_AFTER_WASH_INSPECTION: 'Chờ kiểm tra sau rửa',
  READY_FOR_HANDOVER: 'Sẵn sàng bàn giao',
  WAITING_CUSTOMER_ACCEPTANCE: 'Chờ khách xác nhận',
  WAITING_PAYMENT: 'Chờ thanh toán',
  READY_FOR_RELEASE: 'Sẵn sàng giao xe',
  HANDOVER_ON_HOLD: 'Bàn giao tạm dừng',
  RELEASED: 'Đã bàn giao',
  INCIDENT_HOLD: 'Tạm dừng do sự cố',
  CANCELED: 'Đã hủy',
  NO_SHOW: 'Không đến',
}

/** Label mapping cho available actions */
export const ACTION_LABELS: Record<AvailableAction, string> = {
  'booking.cancel': 'Hủy booking',
  'booking.mark_no_show': 'Không đến',
  'booking.check_in': 'Check-in',
  'inspection.before_wash.create': 'Kiểm tra trước rửa',
  'booking.service.start': 'Bắt đầu dịch vụ',
  'service_item.pause': 'Tạm dừng',
  'service_item.resume': 'Tiếp tục',
  'service_item.complete_early': 'Hoàn thành sớm',
  'service_item.confirm_complete': 'Xác nhận hoàn thành',
  'booking.service.complete': 'Hoàn thành dịch vụ',
}
