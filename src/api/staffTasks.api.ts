/**
 * Staff Task API - đồng bộ với BE `staffTaskRouter` mounted tại
 * `/staff/tasks` (xem `routes/index.js`).
 *
 * Mục đích: cho phép Wash Operator / Vehicle Care Staff thao tác với
 * service items của booking đã IN_PROGRESS:
 *  - PATCH /:id/service-items/:itemKey/pause
 *  - PATCH /:id/service-items/:itemKey/resume
 *  - PATCH /:id/service-items/:itemKey/complete-early
 *  - PATCH /:id/service-items/:itemKey/confirm-complete
 *  - PATCH /:id/service-items/:itemKey/assign-staff
 *  - POST  /:id/incidents
 *  - GET   /:id/incidents/active
 *  - GET   /:id/service-steps
 *  - GET   /:id/service-workflow
 *
 * Capability tương ứng:
 *  - SERVICE_TASK_WASH_EXECUTE_ASSIGNED (Wash Operator)
 *  - SERVICE_TASK_CARE_EXECUTE_ASSIGNED (Care Staff)
 *  - INCIDENT_REPORT_WASH_BAY_FAILURE / STAFF_UNAVAILABLE / OTHER_GARAGE
 */

import { apiClient } from './client'
import type { ApiResponse } from '../types/api'
import type { ApiWorkspaceWorkflow } from '../types/api/workspace'

const STAFF_TASK_PREFIX = '/staff/tasks'

/** Body PATCH pause — BE `pauseServiceItemSchema.body`. */
export interface PauseServiceItemPayload {
  reason: string
}

/** Body PATCH complete-early / confirm-complete — BE `serviceItemOperationSchema.body`. */
export interface ServiceItemNotePayload {
  note?: string
}

/** Body POST report-incident — BE `reportBookingIncidentSchema.body`. */
export type ReportBookingIncidentType =
  | 'WASH_BAY_FAILURE'
  | 'STAFF_UNAVAILABLE'
  | 'OTHER_GARAGE_INCIDENT'

export interface ReportBookingIncidentPayload {
  incident_type: ReportBookingIncidentType
  description?: string
  affected_booking_item_key?: string
  affected_wash_bay_id?: string | null
  affected_staff_profile_id?: string | null
}

export async function pauseServiceItemApi(
  bookingId: string,
  itemKey: string,
  payload: PauseServiceItemPayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiWorkspaceWorkflow>>(
    `${STAFF_TASK_PREFIX}/${bookingId}/service-items/${encodeURIComponent(itemKey)}/pause`,
    payload,
  )
  return data.data
}

export async function resumeServiceItemApi(
  bookingId: string,
  itemKey: string,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiWorkspaceWorkflow>>(
    `${STAFF_TASK_PREFIX}/${bookingId}/service-items/${encodeURIComponent(itemKey)}/resume`,
    {},
  )
  return data.data
}

export async function completeServiceItemEarlyApi(
  bookingId: string,
  itemKey: string,
  payload: ServiceItemNotePayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiWorkspaceWorkflow>>(
    `${STAFF_TASK_PREFIX}/${bookingId}/service-items/${encodeURIComponent(itemKey)}/complete-early`,
    payload,
  )
  return data.data
}

export async function confirmServiceItemCompleteApi(
  bookingId: string,
  itemKey: string,
  payload: ServiceItemNotePayload = {},
) {
  const { data } = await apiClient.patch<ApiResponse<ApiWorkspaceWorkflow>>(
    `${STAFF_TASK_PREFIX}/${bookingId}/service-items/${encodeURIComponent(itemKey)}/confirm-complete`,
    payload,
  )
  return data.data
}

export async function reportBookingIncidentApi(
  bookingId: string,
  payload: ReportBookingIncidentPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiWorkspaceWorkflow>>(
    `${STAFF_TASK_PREFIX}/${bookingId}/incidents`,
    payload,
  )
  return data.data
}
