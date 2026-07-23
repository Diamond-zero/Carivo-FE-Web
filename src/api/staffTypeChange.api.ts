import type { ApiListResponse } from '../types/api/admin'
import type { ApiResponse } from '../types/api'
import type { ApiStaffCapabilitiesResponse } from '../types/api/staffCapabilities'
import type { StaffType } from '../types/staffProfile'
import { apiClient } from './client'

// ============================================================
// BE schemas — đồng bộ với `staff-type-change` module của BE.
// BE expose:
//   POST /staff-profiles/me/type-change-requests           (STAFF tự đề nghị)
//   GET  /staff-profiles/me/type-change-requests           (STAFF xem của mình)
//   GET  /staff-profiles/type-change-requests              (ADMIN list)
//   POST /staff-profiles/:staffProfileId/type-change-requests (ADMIN chủ động điều chuyển — chuẩn bị sẵn)
//   PATCH /staff-profiles/type-change-requests/:id/approve (ADMIN)
//   PATCH /staff-profiles/type-change-requests/:id/reject  (ADMIN)
//   PATCH /staff-profiles/type-change-requests/:id/cancel  (STAFF/ADMIN)
//   GET  /staff-profiles/:id/type-change-impact            (ADMIN)
//   GET  /staff-profiles/:id/type-change-history           (ADMIN)
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

/**
 * Nguồn khởi tạo yêu cầu (BE sẽ lưu field `request_source`).
 * - `STAFF_SELF_REQUEST`: do nhân viên tự tạo.
 * - `ADMIN_DIRECTED`: do admin chủ động điều chuyển.
 */
export type StaffTypeChangeRequestSource =
  | 'STAFF_SELF_REQUEST'
  | 'ADMIN_DIRECTED'
  | string

/**
 * Role của người khởi tạo (BE sẽ lưu field `requested_by_role`).
 */
export type StaffTypeChangeRequestedByRole = 'STAFF' | 'ADMIN' | string

/**
 * Tóm tắt người dùng (request, approve, reject, cancel, acknowledge...).
 * BE mapper `staffTypeChange.mapper.js` → `toUserSummary`.
 */
export interface ApiStaffTypeChangeUserSummary {
  id: string | null
  full_name?: string | null
  email?: string | null
  phone?: string | null
  role?: string | null
}

export interface ApiStaffTypeChangeRequest {
  id: string
  staff_profile_id: string
  from_staff_type: StaffType | string
  to_staff_type: StaffType | string
  from_garage_id?: string | null
  to_garage_id?: string | null
  reason: string
  effective_at?: string | null
  status: StaffTypeChangeStatus
  is_open?: boolean
  /** Nguồn khởi tạo — BE sẽ trả về khi đã thêm field `request_source`. */
  request_source?: StaffTypeChangeRequestSource | null
  requested_by?: string | null
  requester?: ApiStaffTypeChangeUserSummary | null
  requested_by_role?: StaffTypeChangeRequestedByRole | null
  approved_by?: string | null
  approver?: ApiStaffTypeChangeUserSummary | null
  approved_at?: string | null
  applied_at?: string | null
  rejected_by?: string | null
  rejected_at?: string | null
  cancelled_by?: string | null
  cancelled_at?: string | null
  decision_reason?: string | null
  handover_note?: string | null
  emergency_override?: boolean
  override_reason?: string | null
  impact_snapshot?: ApiStaffTypeChangeImpact | null
  failure_reason?: string | null
  /** Nhân viên đã đọc thông báo (BE mới bổ sung). */
  staff_acknowledged_at?: string | null
  staff_acknowledged_by?: string | null
  created_at?: string
  updated_at?: string
}

export interface CreateStaffTypeChangePayload {
  to_staff_type: StaffType
  reason: string
  effective_at?: string
  handover_note?: string
}

/**
 * PATCH /admin/.../approve body — đồng bộ với `approveStaffTypeChangeRequestSchema`
 * của BE (staffTypeChange.validator.js).
 *
 * - `effective_at` tương lai → request chuyển sang SCHEDULED.
 * - `effective_at` rỗng/quá khứ → BE coi như apply ngay (APPROVED → APPLIED).
 * - Khi `emergency_override = true` BẮT BUỘC truyền `override_reason`
 *   (BE sẽ trả 400 nếu thiếu).
 */
export interface ApproveStaffTypeChangePayload {
  effective_at?: string
  handover_note?: string
  emergency_override?: boolean
  override_reason?: string
}

export interface RejectStaffTypeChangePayload {
  reason?: string
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
  request_source?: StaffTypeChangeRequestSource
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

/**
 * Admin chủ động tạo yêu cầu điều chuyển cho nhân viên.
 * Endpoint BE: `POST /api/v1/staff-profiles/:staffProfileId/type-change-requests`
 * (đề xuất MVP). Khi BE chưa merge, hàm vẫn export sẵn để module khác tham chiếu.
 */
export async function createAdminStaffTypeChangeRequestApi(
  staffProfileId: string,
  payload: CreateStaffTypeChangePayload,
) {
  const { data } = await apiClient.post<
    ApiResponse<ApiStaffTypeChangeRequest>
  >(`/staff-profiles/${staffProfileId}/type-change-requests`, payload)
  return data.data
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

export interface ApiStaffTypeChangeImpactBlocker {
  code: string
  count?: number
  message: string
}

export interface ApiStaffTypeChangeImpactWarning {
  code: string
  count?: number
  message: string
}

export interface ApiStaffTypeChangeImpactCapacity {
  source_before: number
  source_after: number
  target_before: number
  target_after: number
}

/**
 * BE `GET /staff-profiles/:id/type-change-impact` — preview ảnh hưởng trước
 * khi đổi. Đồng bộ với `buildStaffTypeChangeImpact` (staffTypeChange.service.js).
 */
export interface ApiStaffTypeChangeImpact {
  generated_at?: string
  effective_at?: string
  applies_immediately?: boolean
  staff_profile_id?: string
  from_staff_type?: string
  to_staff_type?: string
  from_garage_id?: string | null
  to_garage_id?: string | null
  active_assignment_count?: number
  future_assignment_count?: number
  capacity?: ApiStaffTypeChangeImpactCapacity
  blockers?: ApiStaffTypeChangeImpactBlocker[]
  warnings?: ApiStaffTypeChangeImpactWarning[]
  can_apply_now?: boolean
  /** Field legacy / mở rộng BE có thể trả thêm — giữ open shape. */
  [key: string]: unknown
}

export interface GetStaffTypeChangeImpactParams {
  to_staff_type: StaffType
  effective_at?: string
}

export async function getStaffTypeChangeImpactApi(
  staffProfileId: string,
  params: GetStaffTypeChangeImpactParams,
) {
  const { data } = await apiClient.get<ApiResponse<ApiStaffTypeChangeImpact>>(
    `/staff-profiles/${staffProfileId}/type-change-impact`,
    { params },
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
