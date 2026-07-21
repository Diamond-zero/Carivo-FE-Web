import type { ApiResponse } from '../types/api'
import type {
  ApiServiceWorkflow,
  ApiServiceWorkflowItemResponse,
} from '../types/api/staff'
import { apiClient } from './client'

// ============================================================================
// Service workflow — BE docs/staff-api-changes.md section 2
//   GET    /admin/bookings/:id/service-workflow
//   PATCH  /admin/bookings/:id/service-items/:itemKey/complete-early
//   PATCH  /admin/bookings/:id/service-items/:itemKey/confirm-complete
//   PATCH  /admin/bookings/:id/service-items/:itemKey/pause
//   PATCH  /admin/bookings/:id/service-items/:itemKey/resume
//
// Admin-prefix cũ (/admin/bookings/:id/service-workflow) vẫn khả dụng cho admin.
// BE phase:
//   - PENDING              : chưa đến lượt
//   - RUNNING              : đang đếm ngược
//   - PAUSED               : staff pause
//   - INCIDENT_HOLD        : đang chờ customer decision (incident)
//   - COMPLETED            : hoàn thành tất cả item
// ============================================================================

export async function getServiceWorkflowApi(bookingId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiServiceWorkflow>>(
    `/admin/bookings/${bookingId}/service-workflow`,
  )
  return data.data
}

export async function completeEarlyServiceItemApi(
  bookingId: string,
  itemKey: string,
  note?: string,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiServiceWorkflowItemResponse>>(
    `/admin/bookings/${bookingId}/service-items/${encodeURIComponent(itemKey)}/complete-early`,
    note?.trim() ? { note: note.trim() } : {},
  )
  return data.data
}

export async function confirmCompleteServiceItemApi(
  bookingId: string,
  itemKey: string,
  note?: string,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiServiceWorkflowItemResponse>>(
    `/admin/bookings/${bookingId}/service-items/${encodeURIComponent(itemKey)}/confirm-complete`,
    note?.trim() ? { note: note.trim() } : {},
  )
  return data.data
}

export async function pauseServiceItemApi(
  bookingId: string,
  itemKey: string,
  note?: string,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiServiceWorkflowItemResponse>>(
    `/admin/bookings/${bookingId}/service-items/${encodeURIComponent(itemKey)}/pause`,
    note?.trim() ? { note: note.trim() } : {},
  )
  return data.data
}

export async function resumeServiceItemApi(
  bookingId: string,
  itemKey: string,
  note?: string,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiServiceWorkflowItemResponse>>(
    `/admin/bookings/${bookingId}/service-items/${encodeURIComponent(itemKey)}/resume`,
    note?.trim() ? { note: note.trim() } : {},
  )
  return data.data
}
