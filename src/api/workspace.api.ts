/**
 * Staff Workspace API - đồng bộ với BE endpoints:
 * GET /staff/workspace/bookings
 * GET /staff/workspace/bookings/:bookingId/workflow
 * PATCH /staff/workspace/bookings/:bookingId/claim-inspection
 */

import { apiClient } from './client'
import type {
  ApiWorkspaceBookingsResponse,
  ApiWorkspaceWorkflowResponse,
  WorkspaceBookingsParams,
} from '../types/api/workspace'

export async function getWorkspaceBookingsApi(
  params?: WorkspaceBookingsParams,
) {
  const { data } = await apiClient.get<ApiWorkspaceBookingsResponse>(
    '/staff/workspace/bookings',
    { params: { limit: 100, ...params } },
  )
  return {
    bookings: data.data,
    meta: data.meta,
  }
}

export async function getWorkspaceWorkflowApi(bookingId: string) {
  const { data } = await apiClient.get<ApiWorkspaceWorkflowResponse>(
    `/staff/workspace/bookings/${bookingId}/workflow`,
  )
  return data.data
}

/**
 * PATCH /staff/workspace/bookings/:bookingId/claim-inspection
 * VEHICLE_INSPECTION_STAFF tự nhận booking CHECKED_IN để kiểm tra xe.
 * Idempotent — gọi lại bởi chính chủ sẽ trả workflow hiện tại.
 * Trả về ApiWorkspaceWorkflow sau khi cập nhật.
 */
export async function claimInspectionApi(bookingId: string) {
  const { data } = await apiClient.patch<ApiWorkspaceWorkflowResponse>(
    `/staff/workspace/bookings/${bookingId}/claim-inspection`,
  )
  return data.data
}
