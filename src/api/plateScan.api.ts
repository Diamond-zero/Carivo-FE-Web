// ============================================================================
// Plate Scan API client — BE `bookingArrival.swagger.js` (2025-07).
// Base: /staff/booking-arrivals (staff + admin cameras / metrics ở /admin).
// FE side chỉ cần gọi; shape payload đã canonical trong types/api/plateScan.ts.
// ============================================================================

import type { ApiResponse } from '../types/api'
import type { ApiListResponse, ApiPaginationMeta } from '../types/api/admin'
import type {
  ApiArrivalQueueItem,
  ApiArrivalQueueParams,
  ApiCameraDevice,
  ApiCameraDeviceListParams,
  ApiCameraDeviceWithKey,
  ApiConfirmPlateScanPayload,
  ApiCreateCameraDevicePayload,
  ApiCreatePlateScanPayload,
  ApiPlateScan,
  ApiPlateScanListParams,
  ApiPlateScanMetrics,
  ApiPlateScanMetricsParams,
  ApiRejectPlateScanPayload,
  ApiRequestAlternateVehiclePayload,
  ApiRetryPlateScanPayload,
  ApiReviewAlternateVehiclePayload,
  ApiUpdateCameraDevicePayload,
  PlateScanStatus,
  PlateScanStatusVariant,
} from '../types/api/plateScan'
import { apiClient } from './client'

const STAFF_BASE = '/staff/booking-arrivals'
const ADMIN_BASE = '/admin/booking-arrivals'

// ----- Staff: list + create + get + retry ---------------------------------

export async function listPlateScansApi(params: ApiPlateScanListParams = {}) {
  const { data } = await apiClient.get<ApiListResponse<ApiPlateScan[]>>(
    `${STAFF_BASE}/plate-scans`,
    { params: { page: 1, limit: 20, ...params } },
  )
  return data
}

export async function createPlateScanApi(payload: ApiCreatePlateScanPayload) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${STAFF_BASE}/plate-scans`,
    payload,
  )
  return data.data
}

export async function getPlateScanApi(scanId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiPlateScan>>(
    `${STAFF_BASE}/plate-scans/${scanId}`,
  )
  return data.data
}

export async function getArrivalQueueApi(params: ApiArrivalQueueParams = {}) {
  const { data } = await apiClient.get<
    ApiListResponse<ApiArrivalQueueItem[]> & { meta?: ApiPaginationMeta }
  >(`${STAFF_BASE}/arrival-queue`, {
    params: { page: 1, limit: 20, ...params },
  })
  return data
}

export async function retryPlateScanApi(
  scanId: string,
  payload: ApiRetryPlateScanPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${STAFF_BASE}/plate-scans/${scanId}/retry`,
    payload,
  )
  return data.data
}

// ----- Staff: confirm / reject / alternate vehicle ------------------------

export async function confirmPlateScanApi(
  scanId: string,
  payload: ApiConfirmPlateScanPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${STAFF_BASE}/plate-scans/${scanId}/confirm`,
    payload,
  )
  return data.data
}

export async function rejectPlateScanApi(
  scanId: string,
  payload: ApiRejectPlateScanPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${STAFF_BASE}/plate-scans/${scanId}/reject`,
    payload,
  )
  return data.data
}

export async function requestAlternateVehicleApi(
  scanId: string,
  payload: ApiRequestAlternateVehiclePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${STAFF_BASE}/plate-scans/${scanId}/alternate-vehicle`,
    payload,
  )
  return data.data
}

// ----- Admin: scan list cross-garage + metrics -----------------------------

export async function adminListPlateScansApi(params: ApiPlateScanListParams = {}) {
  const { data } = await apiClient.get<ApiListResponse<ApiPlateScan[]>>(
    `${ADMIN_BASE}/plate-scans`,
    { params: { page: 1, limit: 20, ...params } },
  )
  return data
}

export async function adminGetPlateScanMetricsApi(
  params: ApiPlateScanMetricsParams = {},
) {
  const { data } = await apiClient.get<ApiResponse<ApiPlateScanMetrics>>(
    `${ADMIN_BASE}/metrics`,
    { params },
  )
  return data.data
}

export async function adminReviewAlternateVehicleApi(
  scanId: string,
  payload: ApiReviewAlternateVehiclePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${ADMIN_BASE}/plate-scans/${scanId}/alternate-vehicle`,
    payload,
  )
  return data.data
}

// ----- Admin: camera devices CRUD + key rotation ---------------------------

export async function adminListCameraDevicesApi(
  params: ApiCameraDeviceListParams = {},
) {
  const { data } = await apiClient.get<ApiListResponse<ApiCameraDevice[]>>(
    `${ADMIN_BASE}/camera-devices`,
    { params: { page: 1, limit: 20, ...params } },
  )
  return data
}

export async function adminCreateCameraDeviceApi(
  payload: ApiCreateCameraDevicePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiCameraDeviceWithKey>>(
    `${ADMIN_BASE}/camera-devices`,
    payload,
  )
  return data.data
}

export async function adminUpdateCameraDeviceApi(
  id: string,
  payload: ApiUpdateCameraDevicePayload,
) {
  const { data } = await apiClient.patch<ApiResponse<ApiCameraDevice>>(
    `${ADMIN_BASE}/camera-devices/${id}`,
    payload,
  )
  return data.data
}

export async function adminRotateCameraDeviceKeyApi(id: string) {
  const { data } = await apiClient.post<ApiResponse<ApiCameraDeviceWithKey>>(
    `${ADMIN_BASE}/camera-devices/${id}/rotate-key`,
  )
  return data.data
}

// ----- UI label / variant maps (Vietnamese) --------------------------------
// Theo 13 trạng thái của PLATE_SCAN_STATUS_VALUES.

export const PLATE_SCAN_STATUS_LABELS: Record<PlateScanStatus, string> = {
  CAPTURED: 'Đã chụp',
  RECOGNIZING: 'Đang nhận diện',
  QUALITY_REJECTED: 'Ảnh không đạt chất lượng',
  EXACT_MATCH: 'Khớp chính xác',
  FUZZY_CANDIDATES: 'Có ứng viên gần đúng',
  AMBIGUOUS: 'Nhiều biển số trùng khớp',
  NO_MATCH: 'Không tìm thấy booking',
  MULTIPLE_PLATES: 'Nhiều biển số trong ảnh',
  ARRIVAL_DETECTED: 'Camera cổng phát hiện xe đến',
  CONFIRMED: 'Đã xác nhận check-in',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Hết hạn xác nhận',
  FAILED: 'Nhận diện thất bại',
}

export const PLATE_SCAN_STATUS_VARIANT: Record<PlateScanStatus, PlateScanStatusVariant> = {
  CAPTURED: 'info',
  RECOGNIZING: 'info',
  QUALITY_REJECTED: 'warning',
  EXACT_MATCH: 'success',
  FUZZY_CANDIDATES: 'warning',
  AMBIGUOUS: 'warning',
  NO_MATCH: 'warning',
  MULTIPLE_PLATES: 'warning',
  ARRIVAL_DETECTED: 'info',
  CONFIRMED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'default',
  FAILED: 'danger',
}

/** Trạng thái transient — còn cho phép confirm/reject/retry, có countdown `expires_at`. */
export const TRANSIENT_SCAN_STATUSES: PlateScanStatus[] = [
  'EXACT_MATCH',
  'FUZZY_CANDIDATES',
  'AMBIGUOUS',
  'NO_MATCH',
  'MULTIPLE_PLATES',
  'ARRIVAL_DETECTED',
]

/** Trạng thái terminal — không cho action thêm. */
export const TERMINAL_SCAN_STATUSES: PlateScanStatus[] = [
  'CONFIRMED',
  'REJECTED',
  'EXPIRED',
]

export const PLATE_SCAN_REJECTION_REASON_LABELS: Record<
  import('../types/api/plateScan').PlateScanRejectionReason,
  string
> = {
  VEHICLE_MISMATCH: 'Xe không khớp booking',
  WRONG_BOOKING: 'Sai booking',
  POOR_IMAGE: 'Ảnh chụp quá mờ / không đọc được',
  CUSTOMER_NOT_PRESENT: 'Khách không có mặt',
  DUPLICATE_SCAN: 'Trùng lượt quét trước',
  OTHER: 'Lý do khác',
}

export const PLATE_CAPTURE_SOURCE_LABELS: Record<
  import('../types/api/plateScan').PlateCaptureSource,
  string
> = {
  STAFF_CAMERA: 'Camera thiết bị nhân viên',
  GALLERY: 'Tải lên từ thư viện',
  LIVE_CAMERA: 'Camera live (batch 2–5 ảnh)',
  GATE_CAMERA: 'Camera cổng',
  OFFLINE_GATE: 'Camera cổng (offline batch)',
}

export const PLATE_SCAN_MODE_LABELS: Record<
  import('../types/api/plateScan').PlateScanMode,
  string
> = {
  SINGLE: 'Chụp 1 ảnh',
  LIVE_BATCH: 'Live batch (2–5 ảnh)',
  GATE: 'Từ camera cổng',
}

export const ALTERNATE_VEHICLE_STATUS_LABELS: Record<
  import('../types/api/plateScan').AlternateVehicleStatus,
  string
> = {
  NONE: 'Không có yêu cầu',
  REQUESTED: 'Chờ admin duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Đã từ chối',
}

export const CAMERA_DEVICE_STATUS_LABELS: Record<
  import('../types/api/plateScan').CameraDeviceStatus,
  string
> = {
  ACTIVE: 'Đang hoạt động',
  MAINTENANCE: 'Bảo trì',
  INACTIVE: 'Ngưng hoạt động',
  REVOKED: 'Đã thu hồi',
}

export const CAMERA_DEVICE_HEALTH_LABELS: Record<
  import('../types/api/plateScan').CameraDeviceHealthStatus,
  string
> = {
  ONLINE: 'Online',
  STALE: 'Stale (≥2 phút không ping)',
  OFFLINE: 'Offline (≥10 phút)',
  DISABLED: 'Đã tắt',
}

// ----- Backward-compat shims ------------------------------------------------
// `ApiAlternateVehiclePayload` (legacy shape) từng nằm trong types/api/staff.ts
// với `vehicle_id` (BE đổi sang `license_plate + vehicle_type + reason + ...`).
// Re-export một adapter type để code cũ import được mà không vỡ compile,
// đồng thời ép runtime phải dùng canonical `ApiRequestAlternateVehiclePayload`.

/** @deprecated dùng `ApiRequestAlternateVehiclePayload` (license_plate + vehicle_type). */
export type ApiAlternateVehiclePayload = ApiRequestAlternateVehiclePayload
