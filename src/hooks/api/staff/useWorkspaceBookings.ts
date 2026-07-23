/**
 * Hooks cho Staff Workspace - danh sách bookings theo workflow + claim inspection.
 * Dùng thay thế useStaffBookingList để hiển thị workspace cho tất cả staff types.
 *
 * - `useWorkspaceBookings` — list workflow theo garage
 * - `useWorkspaceWorkflow` — detail workflow cho 1 booking
 * - `useClaimInspection` — VEHICLE_INSPECTION_STAFF tự nhận booking để kiểm tra
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  claimInspectionApi,
  getWorkspaceBookingsApi,
  getWorkspaceWorkflowApi,
} from '../../../api/workspace.api'
import { useAuth } from '../../../contexts/AuthContext'
import { staffQueryKeys, workspaceQueryKeys } from './queryKeys'
import type { ApiWorkspaceWorkflow } from '../../../types/api/workspace'

export interface WorkspaceBookingsParams {
  status?: string
  date?: string
  licensePlate?: string
  phone?: string
}

export function useWorkspaceBookings(filters: WorkspaceBookingsParams = {}) {
  const { session, isAuthenticated } = useAuth()
  const garageId = session?.staffProfile.garage_id

  const apiParams = useMemo(() => {
    const params: {
      page?: number
      limit?: number
      garage_id?: string
      status?: string
      from?: string
      to?: string
    } = {
      limit: 100,
    }

    if (garageId) {
      params.garage_id = garageId
    }

    if (filters.status && filters.status !== 'ALL') {
      params.status = filters.status
    }

    if (filters.date) {
      const dayStart = new Date(`${filters.date}T00:00:00`)
      const dayEnd = new Date(`${filters.date}T23:59:59`)
      params.from = dayStart.toISOString()
      params.to = dayEnd.toISOString()
    }

    return params
  }, [filters, garageId])

  return useQuery({
    queryKey: workspaceQueryKeys.bookings(garageId, apiParams),
    queryFn: async () => {
      const result = await getWorkspaceBookingsApi(apiParams)
      return result
    },
    enabled: isAuthenticated && Boolean(garageId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useWorkspaceWorkflow(
  bookingId: string | null | undefined,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: workspaceQueryKeys.workflow(bookingId ?? ''),
    queryFn: () => getWorkspaceWorkflowApi(bookingId as string),
    enabled: Boolean(bookingId) && (options?.enabled ?? true),
    staleTime: 0,
  })
}

/**
 * PATCH /staff/workspace/bookings/:bookingId/claim-inspection
 *
 * - Optimistic update: workflow cache ngay lập tức nhận `assigned_inspection_staff_id = currentUserId`
 *   và `available_actions` thay `'inspection.claim'` bằng `'inspection.before_wash.create'`.
 * - On success: invalidate list bookings + tag inspection-claim.
 * - On 409 INSPECTION_ALREADY_CLAIMED → không crash, refetch để user thấy trạng thái mới.
 */
export function useClaimInspection() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const currentUserId = session?.user.id
  const garageId = session?.staffProfile.garage_id

  return useMutation({
    mutationFn: async (bookingId: string) => {
      return claimInspectionApi(bookingId)
    },
    onMutate: async (bookingId) => {
      await queryClient.cancelQueries({
        queryKey: workspaceQueryKeys.workflow(bookingId),
      })
      const previous = queryClient.getQueryData<ApiWorkspaceWorkflow>(
        workspaceQueryKeys.workflow(bookingId),
      )
      if (previous && currentUserId) {
        queryClient.setQueryData<ApiWorkspaceWorkflow>(
          workspaceQueryKeys.workflow(bookingId),
          {
            ...previous,
            assigned_inspection_staff_id: currentUserId,
            available_actions: previous.available_actions.filter(
              (a) => a !== 'inspection.claim',
            ),
          },
        )
      }
      return { previous, bookingId }
    },
    onError: (_error, bookingId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          workspaceQueryKeys.workflow(bookingId),
          context.previous,
        )
      }
    },
    onSettled: (_data, _error, bookingId) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.bookings(),
      })
      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.workflow(bookingId),
      })
      void queryClient.invalidateQueries({
        queryKey: workspaceQueryKeys.inspectionClaim(),
      })
      // BookingContext.bookings và inspectionStaff dùng staffQueryKeys cũ để
      // render InspectionPage. Sau khi claim, phải refetch list cũ + detail
      // để staff thấy được booking assigned_inspection_staff_id === currentUserId
      // ngay khi navigate vào /service/inspection — không cần logout/login lại.
      if (garageId) {
        void queryClient.invalidateQueries({
          queryKey: staffQueryKeys.bookings(garageId),
        })
        // `useStaffBookingList` dùng key `bookingList` (có params filter) — phải
        // refetch mọi list của staff để BookingListPage reload với data mới.
        void queryClient.invalidateQueries({
          queryKey: ['staff', 'bookings', garageId, 'list'],
        })
      }
      void queryClient.invalidateQueries({
        queryKey: staffQueryKeys.bookingDetail(bookingId),
      })
    },
  })
}