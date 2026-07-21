import type { ApiListResponse, ApiResponse } from '../types/api'
import type { ApiStaffCapabilitiesResponse } from '../types/api/staffCapabilities'
import type { StaffType } from '../types/staffProfile'
import { apiClient } from './client'

// ============================================================
// BE schemas — dựa theo `staff-type-change-requests` Swagger.
// BE expose:
//   POST /staff-profiles/me/type-change-requests   (STAFF tạo yêu cầu)
//   GET  /staff-profiles/me/type-change-requests   (STAFF xem của mình)
//   GET  /staff-profiles/type-change-requests      (ADMIN list)
//   PATCH /staff-profiles/type-change-requests/:id/approve  (ADMIN)
//   PATCH /staff-profiles/type-change-requests/:id/reject   (ADMIN)
//   PATCH /staff-profiles/type-change-requests/:id/cancel   (STAFF/ADMIN)
//   GET /staff-profiles/:id/type-change-impact     (ADMIN)
//   GET /staff-profiles/:id/type-change-history    (ADMIN)
// ============================================================

export type StaffTypeChangeStatus =
  | 'REQUESTED'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'APPLIED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'FAILED'
  | string

export interface ApiStaffTypeChangeRequest {
  id: string
  staff_profile_id: string
  from_staff_type: StaffType | string
  to_staff_type: StaffType | string
  reason: string
  effective_at?: string | null
  status: StaffTypeChangeStatus
  approved_at?: string | null
  applied_at?: string | null
  handover_note?: string | null
  /** Snapshot impact tại thời điểm request được BE tạo (BE open shape). */
  impact_snapshot?: Record<string, unknown> | null
  created_at?: string
  updated_at?: string
}

export interface CreateStaffTypeChangePayload {
  to_staff_type: StaffType
  reason: string
  effective_at?: string
  handover_note?: string
}

/** PATCH /admin/.../approve body — chưa rõ schema cụ thể, optional fields. */
export interface ApproveStaffTypeChangePayload {
  /** Nếu có, request chuyển sang SCHEDULED thay vì APPROVED. */
  effective_at?: string
  /** Ghi chú nội bộ khi admin duyệt. */
  admin_note?: string
}

export interface RejectStaffTypeChangePayload {
  reason?: string
  admin_note?: string
}

export interface CancelStaffTypeChangePayload {
  reason?: string
}

// ---- STAFF (caller) ----

export async function getMyStaffTypeChangeRequestsApi() {
  const { data } = await apiClient.get<
    ApiResponse<ApiStaffTypeChangeRequest[]>
  >('/staff-profiles/me/type-change-requests')
  return data.data
}

export async function createStaffTypeChangeRequestApi(
  payload: CreateStaffTypeChangePayload,
) {
  const { data } = await apiClient.post<
    ApiResponse<ApiStaffTypeChangeRequest>
  >('/staff-profiles/me/type-change-requests', payload)
  return data.data
}

// ---- ADMIN ----

export interface AdminStaffTypeChangeListParams {
  status?: StaffTypeChangeStatus
  staff_profile_id?: string
  page?: number
  limit?: number
}

export async function listAdminStaffTypeChangeRequestsApi(
  params: AdminStaffTypeChangeListParams = {},
) {
  const { data } = await apiClient.get<
    ApiListResponse<ApiStaffTypeChangeRequest[]>
  >('/staff-profiles/type-change-requests', {
    params: {
      page: 1,
      limit: 20,
      ...params,
    },
  })
  return data
}

export async function approveStaffTypeChangeRequestApi(
  requestId: string,
  payload: ApproveStaffTypeChangePayload = {},
) {
  const { data } = await apiClient.patch<
    ApiResponse<ApiStaffTypeChangeRequest>
  >(`/staff-profiles/type-change-requests/${requestId}/approve`, payload)
  return data.data
}

export async function rejectStaffTypeChangeRequestApi(
  requestId: string,
  payload: RejectStaffTypeChangePayload = {},
) {
  const { data } = await apiClient.patch<
    ApiResponse<ApiStaffTypeChangeRequest>
  >(`/staff-profiles/type-change-requests/${requestId}/reject`, payload)
  return data.data
}

export async function cancelStaffTypeChangeRequestApi(
  requestId: string,
  payload: CancelStaffTypeChangePayload = {},
) {
  const { data } = await apiClient.patch<
    ApiResponse<ApiStaffTypeChangeRequest>
  >(`/staff-profiles/type-change-requests/${requestId}/cancel`, payload)
  return data.data
}

// ---- Impact & History (Admin) ----

/**
 * BE `GET /staff-profiles/:id/type-change-impact` — preview ảnh hưởng trước
 * khi đổi. Swagger không expose schema cụ thể, FE dùng open shape.
 */
export type ApiStaffTypeChangeImpact = Record<string, unknown> & {
  staff_profile_id?: string
  from_staff_type?: string
  /** Ảnh hưởng đến các booking đang phụ trách. */
  affected_open_bookings?: number
  affected_active_steps?: number
  pending_assignments?: number
  /** Snapshot các khía cạnh BE tính toán. */
  workload_summary?: Record<string, unknown>
  /** Liệt kê booking/step sẽ bị ảnh hưởng. */
  affected_items?: Array<Record<string, unknown>>
}

export async function getStaffTypeChangeImpactApi(staffProfileId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiStaffTypeChangeImpact>>(
    `/staff-profiles/${staffProfileId}/type-change-impact`,
  )
  return data.data
}

/**
 * BE `GET /staff-profiles/:id/type-change-history` — lịch sử các lần đã đổi.
 */
export interface ApiStaffTypeChangeHistoryEntry {
  id: string
  staff_profile_id?: string
  from_staff_type?: string
  to_staff_type?: string
  applied_at?: string
  approved_by_id?: string
  note?: string
}

export async function getStaffTypeChangeHistoryApi(staffProfileId: string) {
  const { data } = await apiClient.get<
    ApiResponse<ApiStaffTypeChangeHistoryEntry[]>
  >(`/staff-profiles/${staffProfileId}/type-change-history`)
  return data.data
}

// Re-export for convenience
export type { ApiStaffCapabilitiesResponse }
