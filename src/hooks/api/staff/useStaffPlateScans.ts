// ============================================================================
// Plate scan hooks — staff (create / list / queue / detail / confirm / reject /
// retry / alternate) + admin (cross-garage scans / metrics / camera devices /
// approve alternate vehicle).
//
// Polling 10s cho list + queue vì BE có scheduler expire → status có thể đổi
// sang EXPIRED / CONFIRMED mà FE cần refresh UI.
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  adminCreateCameraDeviceApi,
  adminGetPlateScanMetricsApi,
  adminListCameraDevicesApi,
  adminListPlateScansApi,
  adminReviewAlternateVehicleApi,
  adminRotateCameraDeviceKeyApi,
  adminUpdateCameraDeviceApi,
  confirmPlateScanApi,
  createPlateScanApi,
  getArrivalQueueApi,
  getPlateScanApi,
  listPlateScansApi,
  rejectPlateScanApi,
  requestAlternateVehicleApi,
  retryPlateScanApi,
} from '../../../api/plateScan.api'
import type {
  ApiCameraDeviceListParams,
  ApiConfirmPlateScanPayload,
  ApiCreateCameraDevicePayload,
  ApiCreatePlateScanPayload,
  ApiPlateScanListParams,
  ApiPlateScanMetricsParams,
  ApiRejectPlateScanPayload,
  ApiRequestAlternateVehiclePayload,
  ApiRetryPlateScanPayload,
  ApiReviewAlternateVehiclePayload,
  ApiUpdateCameraDevicePayload,
} from '../../../types/api/plateScan'

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const staffPlateScanQueryKeys = {
  all: ['staff', 'plate-scans'] as const,
  list: (params?: ApiPlateScanListParams) =>
    ['staff', 'plate-scans', 'list', params ?? {}] as const,
  queue: (params?: { page?: number; limit?: number; garage_id?: string }) =>
    ['staff', 'plate-scans', 'queue', params ?? {}] as const,
  detail: (scanId: string) =>
    ['staff', 'plate-scans', 'detail', scanId] as const,
}

export const adminPlateScanQueryKeys = {
  all: ['admin', 'plate-scans'] as const,
  list: (params?: ApiPlateScanListParams) =>
    ['admin', 'plate-scans', 'list', params ?? {}] as const,
  metrics: (params?: ApiPlateScanMetricsParams) =>
    ['admin', 'plate-scans', 'metrics', params ?? {}] as const,
  cameras: (params?: ApiCameraDeviceListParams) =>
    ['admin', 'plate-scans', 'cameras', params ?? {}] as const,
}

// ---------------------------------------------------------------------------
// Staff queries
// ---------------------------------------------------------------------------

export function useStaffPlateScans(params: ApiPlateScanListParams = {}) {
  return useQuery({
    queryKey: staffPlateScanQueryKeys.list(params),
    queryFn: () => listPlateScansApi(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 10_000,
  })
}

export function useStaffArrivalQueue(
  params: { page?: number; limit?: number; garage_id?: string } = {},
) {
  return useQuery({
    queryKey: staffPlateScanQueryKeys.queue(params),
    queryFn: () => getArrivalQueueApi(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 10_000,
  })
}

export function useStaffPlateScanDetail(scanId: string | undefined) {
  return useQuery({
    queryKey: staffPlateScanQueryKeys.detail(scanId ?? ''),
    queryFn: () => getPlateScanApi(scanId ?? ''),
    enabled: Boolean(scanId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 10_000,
  })
}

// ---------------------------------------------------------------------------
// Staff mutations
// ---------------------------------------------------------------------------

export function useCreatePlateScanMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiCreatePlateScanPayload) =>
      createPlateScanApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
    },
  })
}

export function useRetryPlateScanMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiRetryPlateScanPayload) =>
      retryPlateScanApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffPlateScanQueryKeys.detail(scanId),
      })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
    },
  })
}

export function useConfirmPlateScanMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiConfirmPlateScanPayload) =>
      confirmPlateScanApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffPlateScanQueryKeys.detail(scanId),
      })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
      void qc.invalidateQueries({
        queryKey: ['staff', 'plate-scans', 'queue'],
      })
      void qc.invalidateQueries({ queryKey: ['staff', 'bookings'] })
    },
  })
}

export function useRejectPlateScanMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiRejectPlateScanPayload) =>
      rejectPlateScanApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffPlateScanQueryKeys.detail(scanId),
      })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
      void qc.invalidateQueries({
        queryKey: ['staff', 'plate-scans', 'queue'],
      })
    },
  })
}

export function useRequestAlternateVehicleMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiRequestAlternateVehiclePayload) =>
      requestAlternateVehicleApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: staffPlateScanQueryKeys.detail(scanId),
      })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
    },
  })
}

// ---------------------------------------------------------------------------
// Admin queries / mutations
// ---------------------------------------------------------------------------

export function useAdminPlateScans(params: ApiPlateScanListParams = {}) {
  return useQuery({
    queryKey: adminPlateScanQueryKeys.list(params),
    queryFn: () => adminListPlateScansApi(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })
}

export function useAdminPlateScanMetrics(params: ApiPlateScanMetricsParams = {}) {
  return useQuery({
    queryKey: adminPlateScanQueryKeys.metrics(params),
    queryFn: () => adminGetPlateScanMetricsApi(params),
    staleTime: 60_000,
    refetchOnMount: 'always',
  })
}

export function useAdminCameraDevices(params: ApiCameraDeviceListParams = {}) {
  return useQuery({
    queryKey: adminPlateScanQueryKeys.cameras(params),
    queryFn: () => adminListCameraDevicesApi(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  })
}

export function useAdminCreateCameraDeviceMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiCreateCameraDevicePayload) =>
      adminCreateCameraDeviceApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminPlateScanQueryKeys.cameras() })
    },
  })
}

export function useAdminUpdateCameraDeviceMutation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiUpdateCameraDevicePayload) =>
      adminUpdateCameraDeviceApi(id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminPlateScanQueryKeys.cameras() })
    },
  })
}

export function useAdminRotateCameraDeviceKeyMutation(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => adminRotateCameraDeviceKeyApi(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: adminPlateScanQueryKeys.cameras() })
    },
  })
}

export function useAdminReviewAlternateVehicleMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiReviewAlternateVehiclePayload) =>
      adminReviewAlternateVehicleApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: adminPlateScanQueryKeys.list(),
      })
      void qc.invalidateQueries({
        queryKey: staffPlateScanQueryKeys.detail(scanId),
      })
    },
  })
}
