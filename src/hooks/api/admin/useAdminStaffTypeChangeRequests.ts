import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveStaffTypeChangeRequestApi,
  cancelStaffTypeChangeRequestApi,
  getStaffTypeChangeHistoryApi,
  getStaffTypeChangeImpactApi,
  listAdminStaffTypeChangeRequestsApi,
  rejectStaffTypeChangeRequestApi,
  type AdminStaffTypeChangeListParams,
  type ApproveStaffTypeChangePayload,
  type CancelStaffTypeChangePayload,
  type RejectStaffTypeChangePayload,
} from '../../../api/staffTypeChange.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys, staffQueryKeys } from '../queryKeys'

/**
 * ADMIN: danh sách yêu cầu đổi chức năng (toàn hệ thống).
 */
export function useAdminStaffTypeChangeRequests(
  params: AdminStaffTypeChangeListParams = {},
) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: adminQueryKeys.staffTypeChangeRequests(params),
    queryFn: () => listAdminStaffTypeChangeRequestsApi(params),
    enabled: isAuthenticated,
    staleTime: 15_000,
  })
}

/**
 * ADMIN: xem ảnh hưởng trước khi duyệt đổi.
 */
export function useAdminStaffTypeChangeImpact(staffProfileId?: string) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: staffProfileId
      ? adminQueryKeys.staffTypeChangeImpact(staffProfileId)
      : ['admin', 'staff-type-change-impact', 'disabled'],
    queryFn: () => getStaffTypeChangeImpactApi(staffProfileId!),
    enabled: isAuthenticated && !!staffProfileId,
    staleTime: 30_000,
  })
}

/**
 * ADMIN: lịch sử các lần đổi chức năng đã áp dụng cho 1 staff.
 */
export function useAdminStaffTypeChangeHistory(staffProfileId?: string) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: staffProfileId
      ? adminQueryKeys.staffTypeChangeHistory(staffProfileId)
      : ['admin', 'staff-type-change-history', 'disabled'],
    queryFn: () => getStaffTypeChangeHistoryApi(staffProfileId!),
    enabled: isAuthenticated && !!staffProfileId,
    staleTime: 30_000,
  })
}

/**
 * ADMIN: duyệt yêu cầu đổi.
 */
export function useApproveAdminStaffTypeChangeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string
      payload?: ApproveStaffTypeChangePayload
    }) => approveStaffTypeChangeRequestApi(requestId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'staff-type-change-requests'],
      })
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
      void qc.invalidateQueries({ queryKey: adminQueryKeys.staffTypeChangeHistory('any') })
    },
  })
}

/**
 * ADMIN: từ chối yêu cầu đổi.
 */
export function useRejectAdminStaffTypeChangeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string
      payload?: RejectStaffTypeChangePayload
    }) => rejectStaffTypeChangeRequestApi(requestId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'staff-type-change-requests'],
      })
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
    },
  })
}

/**
 * ADMIN: hủy một yêu cầu đã duyệt (áp dụng cho cả request APPROVED/SCHEDULED
 * trước khi applied).
 */
export function useCancelAdminStaffTypeChangeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      requestId,
      payload,
    }: {
      requestId: string
      payload?: CancelStaffTypeChangePayload
    }) => cancelStaffTypeChangeRequestApi(requestId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'staff-type-change-requests'],
      })
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
    },
  })
}
