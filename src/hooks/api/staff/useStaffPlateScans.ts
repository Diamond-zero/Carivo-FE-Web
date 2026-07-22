import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmPlateScanApi,
  getArrivalQueueApi,
  getPlateScanApi,
  listPlateScansApi,
  recognizePlateApi,
  rejectPlateScanApi,
  requestAlternateVehicleApi,
  retryPlateScanApi,
} from '../../../api/plateScan.api'
import type {
  ApiAlternateVehiclePayload,
  ApiConfirmPlateScanPayload,
  ApiPlateScanListParams,
  ApiRecognizePlatePayload,
  ApiRejectPlateScanPayload,
  ApiRetryPlateScanPayload,
} from '../../../types/api/plateScan'

export const staffPlateScanQueryKeys = {
  all: ['staff', 'plate-scans'] as const,
  list: (params?: unknown) => ['staff', 'plate-scans', 'list', params] as const,
  queue: ['staff', 'plate-scans', 'queue'] as const,
  detail: (scanId: string) => ['staff', 'plate-scans', 'detail', scanId] as const,
}

export function useStaffPlateScans(params: ApiPlateScanListParams = {}) {
  return useQuery({
    queryKey: staffPlateScanQueryKeys.list(params),
    queryFn: () => listPlateScansApi(params),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 10_000,
  })
}

export function useStaffArrivalQueue() {
  return useQuery({
    queryKey: staffPlateScanQueryKeys.queue,
    queryFn: getArrivalQueueApi,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: 10_000,
  })
}

export function useStaffPlateScanDetail(scanId: string | undefined) {
  return useQuery({
    queryKey: staffPlateScanQueryKeys.detail(scanId ?? ''),
    queryFn: () => getPlateScanApi(scanId!),
    enabled: Boolean(scanId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useRecognizePlateMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiRecognizePlatePayload) => recognizePlateApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
    },
  })
}

export function useRetryPlateScanMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiRetryPlateScanPayload) => retryPlateScanApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.detail(scanId) })
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
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.detail(scanId) })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.queue })
    },
  })
}

export function useRejectPlateScanMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiRejectPlateScanPayload) => rejectPlateScanApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.detail(scanId) })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.queue })
    },
  })
}

export function useRequestAlternateVehicleMutation(scanId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: ApiAlternateVehiclePayload) =>
      requestAlternateVehicleApi(scanId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.detail(scanId) })
      void qc.invalidateQueries({ queryKey: staffPlateScanQueryKeys.all })
    },
  })
}