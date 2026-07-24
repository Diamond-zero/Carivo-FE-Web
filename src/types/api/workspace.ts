/**
 * Types cho Staff Workspace API - đồng bộ với BE:
 * GET /staff/workspace/bookings
 * GET /staff/workspace/bookings/:bookingId/workflow
 */

import type { ApiResponse } from './api'

/** Workflow phases theo BE định nghĩa (BE/WDP301-Project/backend/src/shared/constants/bookingWorkflow.constant.js) */
export type WorkflowPhase =
  | 'WAITING_CHECK_IN'
  | 'WAITING_BEFORE_WASH_INSPECTION'
  | 'READY_FOR_SERVICE'
  | 'SERVICE_IN_PROGRESS'
  | 'WAITING_AFTER_WASH_INSPECTION'
  | 'READY_TO_COMPLETE_SERVICE'
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
export type WorkspacePaymentStatus = 'UNPAID' | 'PENDING' | 'PAID' | 'WAIVED'

/** Vehicle types */
export type VehicleType = 'CAR' | 'MOTORBIKE' | 'OTHER'

/** Available actions từ workflow API - dùng để quyết định hiển thị nút */
export type AvailableAction =
  | 'booking.cancel'
  | 'booking.mark_no_show'
  | 'booking.check_in'
  | 'inspection.claim'
  | 'inspection.before_wash.create'
  | 'inspection.after_wash.create'
  | 'booking.service.start'
  | 'service_item.pause'
  | 'service_item.resume'
  | 'service_item.complete_early'
  | 'service_item.confirm_complete'
  | 'booking.service.complete'
  | 'booking.payment.collect_cash'
  | 'handover.prepare'
  | 'handover.walk_in_accept'
  | 'handover.release'

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
  /** Walk-in booking = `is_walk_in: true` → handover accept đi qua staff (walk-in-accept). */
  is_walk_in?: boolean
  current_service_item_key: string | null
  payment_status: WorkspacePaymentStatus
  blocked_by_incident: boolean
  available_actions: AvailableAction[]
  service_package_name: string | null
  final_price: number
  earned_points: number
}

/** Inspection milestone trong workflow detail (BE `StaffBookingWorkflowInspectionMilestone`) */
export interface ApiInspectionMilestone {
  status: 'DONE' | 'PENDING' | 'NOT_READY'
  inspected_at: string | null
  inspected_by_id: string | null
  image_count: number
}

/** Service item trong workflow detail (BE `StaffBookingWorkflowServiceItem`) */
export interface ApiServiceItem {
  item_key: string
  name: string
  sequence: number
  status:
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'PAUSED'
    | 'AWAITING_CONFIRMATION'
    | 'WAITING_RESOURCE'
    | 'DONE'
    | 'SKIPPED'
  duration_minutes: number
  transition_mode: 'AUTO' | 'REQUIRE_CONFIRMATION'
  actual_started_at: string | null
  countdown_ends_at: string | null
  actual_completed_at: string | null
  remaining_seconds_at_pause: number | null
  requires_wash_bay: boolean
  requires_care_staff: boolean
  assigned_to_current_user: boolean
}

/** Service step trong workflow detail */
export interface ApiServiceStep {
  key: string
  name: string
  status: 'PENDING' | 'IN_PROGRESS' | 'DONE' | 'SKIPPED'
  automated: boolean
  wash_bay_id: string | null
}

/** Workflow blockers (BE `BOOKING_WORKFLOW_BLOCKER_VALUES`) */
export type WorkflowBlocker =
  | 'INCIDENT_HOLD'
  | 'CHECK_IN_REQUIRED'
  | 'BEFORE_WASH_INSPECTION_REQUIRED'
  | 'SERVICE_ITEMS_NOT_DONE'
  | 'AFTER_WASH_INSPECTION_REQUIRED'
  | 'REQUIRED_SERVICE_STEPS_NOT_DONE'
  | 'HANDOVER_CUSTOMER_RESPONSE_REQUIRED'
  | 'PAYMENT_REQUIRED'

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
  is_walk_in?: boolean
  current_service_item_key: string | null
  payment_status: WorkspacePaymentStatus
  blocked_by_incident: boolean
  server_time: string
  operation_status: 'NORMAL' | 'AWAITING_CUSTOMER_DECISION'
  payment: {
    method: 'CASH' | 'PAYOS' | null
    status: WorkspacePaymentStatus | null
  } | null
  milestones: {
    check_in: Record<string, unknown> | null
    before_wash_inspection: ApiInspectionMilestone | null
    service: Record<string, unknown> | null
    after_wash_inspection: ApiInspectionMilestone | null
    handover: Record<string, unknown> | null
  }
  service_items: ApiServiceItem[]
  service_steps: ApiServiceStep[]
  blockers: WorkflowBlocker[]
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
  READY_TO_COMPLETE_SERVICE: 'Sẵn sàng hoàn thành dịch vụ',
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

/** Label mapping cho workflow blockers (BE BOOKING_WORKFLOW_BLOCKER_VALUES) */
export const WORKFLOW_BLOCKER_LABELS: Record<WorkflowBlocker, string> = {
  INCIDENT_HOLD: 'Booking đang tạm dừng do sự cố chưa được khách xử lý',
  CHECK_IN_REQUIRED: 'Booking chưa được check-in',
  BEFORE_WASH_INSPECTION_REQUIRED: 'Cần tạo biên bản kiểm tra trước rửa',
  SERVICE_ITEMS_NOT_DONE: 'Còn hạng mục dịch vụ (rửa/chăm sóc) chưa hoàn thành',
  AFTER_WASH_INSPECTION_REQUIRED: 'Cần tạo biên bản kiểm tra sau rửa',
  REQUIRED_SERVICE_STEPS_NOT_DONE:
    'Còn bước dịch vụ bắt buộc chưa hoàn thành (cần ảnh bằng chứng trong biên bản kiểm tra sau rửa)',
  HANDOVER_CUSTOMER_RESPONSE_REQUIRED: 'Đang chờ khách hàng phản hồi bàn giao',
  PAYMENT_REQUIRED: 'Chưa thanh toán',
}

/** Label mapping cho available actions */
export const ACTION_LABELS: Record<AvailableAction, string> = {
  'booking.cancel': 'Hủy booking',
  'booking.mark_no_show': 'Không đến',
  'booking.check_in': 'Check-in',
  'inspection.claim': 'Nhận kiểm tra',
  'inspection.before_wash.create': 'Kiểm tra trước rửa',
  'inspection.after_wash.create': 'Kiểm tra sau rửa',
  'booking.service.start': 'Bắt đầu dịch vụ',
  'service_item.pause': 'Tạm dừng',
  'service_item.resume': 'Tiếp tục',
  'service_item.complete_early': 'Hoàn thành sớm',
  'service_item.confirm_complete': 'Xác nhận hoàn thành',
  'booking.service.complete': 'Hoàn thành dịch vụ',
  'booking.payment.collect_cash': 'Thu tiền mặt',
  'handover.prepare': 'Chuẩn bị bàn giao',
  'handover.walk_in_accept': 'Khách walk-in xác nhận nhận xe',
  'handover.release': 'Bàn giao xe',
}
