import type { ApiListResponse, ApiResponse } from '../types/api'
import type {
  ApiAlternateVehiclePayload,
  ApiArrivalQueueItem,
  ApiConfirmPlateScanPayload,
  ApiPlateScan,
  ApiPlateScanListParams,
  ApiRecognizePlatePayload,
  ApiRejectPlateScanPayload,
  ApiRetryPlateScanPayload,
} from '../types/api/plateScan'
import { apiClient } from './client'

const BASE = '/staff/booking-arrivals'

export async function listPlateScansApi(params: ApiPlateScanListParams = {}) {
  const { data } = await apiClient.get<ApiListResponse<ApiPlateScan[]>>(
    `${BASE}/plate-scans`,
    { params: { page: 1, limit: 20, ...params } },
  )
  return data
}

export async function recognizePlateApi(payload: ApiRecognizePlatePayload) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${BASE}/plate-scans`,
    payload,
  )
  return data.data
}

export async function getArrivalQueueApi() {
  const { data } = await apiClient.get<ApiResponse<ApiArrivalQueueItem[]>>(
    `${BASE}/arrival-queue`,
  )
  return data.data
}

export async function getPlateScanApi(scanId: string) {
  const { data } = await apiClient.get<ApiResponse<ApiPlateScan>>(
    `${BASE}/plate-scans/${scanId}`,
  )
  return data.data
}

export async function retryPlateScanApi(
  scanId: string,
  payload: ApiRetryPlateScanPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${BASE}/plate-scans/${scanId}/retry`,
    payload,
  )
  return data.data
}

export async function confirmPlateScanApi(
  scanId: string,
  payload: ApiConfirmPlateScanPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${BASE}/plate-scans/${scanId}/confirm`,
    payload,
  )
  return data.data
}

export async function rejectPlateScanApi(
  scanId: string,
  payload: ApiRejectPlateScanPayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${BASE}/plate-scans/${scanId}/reject`,
    payload,
  )
  return data.data
}

export async function requestAlternateVehicleApi(
  scanId: string,
  payload: ApiAlternateVehiclePayload,
) {
  const { data } = await apiClient.post<ApiResponse<ApiPlateScan>>(
    `${BASE}/plate-scans/${scanId}/alternate-vehicle`,
    payload,
  )
  return data.data
}

export const PLATE_SCAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Chờ xử lý',
  MATCHED: 'Đã khớp booking',
  CONFIRMED: 'Đã xác nhận',
  REJECTED: 'Đã từ chối',
  EXPIRED: 'Hết hạn',
  NEEDS_ALTERNATE_VEHICLE: 'Cần xe thay thế',
}

export const PLATE_SCAN_STATUS_VARIANT: Record<
  string,
  'default' | 'success' | 'warning' | 'danger' | 'info'
> = {
  PENDING: 'warning',
  MATCHED: 'info',
  CONFIRMED: 'success',
  REJECTED: 'danger',
  EXPIRED: 'default',
  NEEDS_ALTERNATE_VEHICLE: 'warning',
}