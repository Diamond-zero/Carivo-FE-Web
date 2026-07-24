/**
 * Hooks cho Staff Tasks — service items + incident reporting.
 *
 * - `useStaffTaskWorkflow` — workflow detail (lấy lại từ
 *   `useWorkspaceWorkflow` nhưng dùng queryKey family `staff-tasks` để chia sẻ
 *   cache với các mutation bên dưới).
 * - `usePauseServiceItem` / `useResumeServiceItem` / `useCompleteServiceItemEarly` /
 *   `useConfirmServiceItemComplete` — tương ứng 4 endpoint PATCH.
 * - `useReportBookingIncident` — POST báo cáo sự cố (vd WASH_BAY_FAILURE /
 *   STAFF_UNAVAILABLE / OTHER_GARAGE_INCIDENT).
 *
 * Tất cả mutation đều `invalidateQueries` workflow → UI tự refetch và cập nhật
 * countdown / status. Đây là lý do user trước đó "bị mất trang": workflow
 * không được refetch sau mutation, dẫn tới UI stale.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  completeServiceItemEarlyApi,
  confirmServiceItemCompleteApi,
  pauseServiceItemApi,
  reportBookingIncidentApi,
  resumeServiceItemApi,
  type PauseServiceItemPayload,
  type ReportBookingIncidentPayload,
  type ServiceItemNotePayload,
} from '../../../api/staffTasks.api'
import { getWorkspaceWorkflowApi } from '../../../api/workspace.api'
import { staffTaskQueryKeys, workspaceQueryKeys } from './queryKeys'
import type { ApiWorkspaceWorkflow } from '../../../types/api/workspace'

interface UseStaffTaskWorkflowOptions {
  enabled?: boolean
  /**
   * Polling interval (ms). Mặc định `5000` để auto-refetch countdown tự
   * động cập nhật mà không cần user làm gì. Trang ServiceExecutionPage chỉ
   * mount polling khi booking đang IN_PROGRESS (để tránh spam request).
   */
  refetchInterval?: number | false
}

/**
 * Workflow detail cho staff task view. Wraps `getWorkspaceWorkflowApi`
 * (`GET /staff/workspace/bookings/:id/workflow`) — endpoint này BE trả về
 * `service_items` với countdown + assigned_to_current_user + available_actions,
 * phục vụ đầy đủ cho UI thực hiện dịch vụ.
 */
export function useStaffTaskWorkflow(
  bookingId: string | null | undefined,
  options: UseStaffTaskWorkflowOptions = {},
) {
  return useQuery({
    queryKey: staffTaskQueryKeys.workflow(bookingId ?? ''),
    queryFn: () => getWorkspaceWorkflowApi(bookingId as string),
    enabled: Boolean(bookingId) && (options.enabled ?? true),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: options.refetchInterval,
  })
}

/**
 * Helper: invalidate mọi workflow cache (cả staff-task lẫn workspace) để UI
 * refresh sau mutation. Dùng cho tất cả mutation bên dưới.
 */
function invalidateWorkflow(queryClient: ReturnType<typeof useQueryClient>, bookingId: string) {
  void queryClient.invalidateQueries({
    queryKey: staffTaskQueryKeys.workflow(bookingId),
  })
  void queryClient.invalidateQueries({
    queryKey: workspaceQueryKeys.workflow(bookingId),
  })
  void queryClient.invalidateQueries({
    queryKey: workspaceQueryKeys.bookings(),
  })
  // Cũng refetch list bookings của staff để cột "Booking" sidebar / dashboard
  // đồng bộ trạng thái (vd PAUSED).
  void queryClient.invalidateQueries({
    queryKey: ['staff', 'bookings'],
  })
}

export function usePauseServiceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookingId,
      itemKey,
      payload,
    }: {
      bookingId: string
      itemKey: string
      payload: PauseServiceItemPayload
    }) => pauseServiceItemApi(bookingId, itemKey, payload),
    onSuccess: (_data, { bookingId }) => {
      invalidateWorkflow(queryClient, bookingId)
    },
  })
}

export function useResumeServiceItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookingId,
      itemKey,
    }: {
      bookingId: string
      itemKey: string
    }) => resumeServiceItemApi(bookingId, itemKey),
    onSuccess: (_data, { bookingId }) => {
      invalidateWorkflow(queryClient, bookingId)
    },
  })
}

export function useCompleteServiceItemEarly() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookingId,
      itemKey,
      payload,
    }: {
      bookingId: string
      itemKey: string
      payload?: ServiceItemNotePayload
    }) => completeServiceItemEarlyApi(bookingId, itemKey, payload),
    onSuccess: (_data, { bookingId }) => {
      invalidateWorkflow(queryClient, bookingId)
    },
  })
}

export function useConfirmServiceItemComplete() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookingId,
      itemKey,
      payload,
    }: {
      bookingId: string
      itemKey: string
      payload?: ServiceItemNotePayload
    }) => confirmServiceItemCompleteApi(bookingId, itemKey, payload),
    onSuccess: (_data, { bookingId }) => {
      invalidateWorkflow(queryClient, bookingId)
    },
  })
}

export function useReportBookingIncident() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      bookingId,
      payload,
    }: {
      bookingId: string
      payload: ReportBookingIncidentPayload
    }) => reportBookingIncidentApi(bookingId, payload),
    onSuccess: (_data, { bookingId }) => {
      // Sau khi báo cáo incident, BE set `blocked_by_incident = true` → workflow
      // trả về `INCIDENT_HOLD`. Refetch đầy đủ để UI hiển thị đúng trạng thái.
      invalidateWorkflow(queryClient, bookingId)
      void queryClient.invalidateQueries({
        queryKey: staffTaskQueryKeys.activeIncident(bookingId),
      })
    },
  })
}

/** Re-export type để caller dùng. */
export type { ApiWorkspaceWorkflow }
