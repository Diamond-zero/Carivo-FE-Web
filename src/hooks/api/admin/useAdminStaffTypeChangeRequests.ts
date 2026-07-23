import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  approveStaffTypeChangeRequestApi,
  cancelStaffTypeChangeRequestApi,
  createAdminStaffTypeChangeRequestApi,
  getStaffTypeChangeHistoryApi,
  getStaffTypeChangeImpactApi,
  listAdminStaffTypeChangeRequestsApi,
  rejectStaffTypeChangeRequestApi,
  type AdminStaffTypeChangeListParams,
  type ApiStaffTypeChangeRequest,
  type ApproveStaffTypeChangePayload,
  type CancelStaffTypeChangePayload,
  type CreateStaffTypeChangePayload,
  type GetStaffTypeChangeImpactParams,
  type RejectStaffTypeChangePayload,
} from '../../../api/staffTypeChange.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'
import { staffQueryKeys } from '../staff/queryKeys'

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
 *
 * BE yêu cầu query `to_staff_type` (và tuỳ chọn `effective_at`). Hook nhận
 * `params` tương ứng; component dùng `enabled` để bật/tắt khi đã chọn xong.
 */
export function useAdminStaffTypeChangeImpact(
  staffProfileId?: string,
  params?: GetStaffTypeChangeImpactParams,
) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: staffProfileId
      ? adminQueryKeys.staffTypeChangeImpact(staffProfileId, params)
      : ['admin', 'staff-type-change-impact', 'disabled'],
    queryFn: () => getStaffTypeChangeImpactApi(staffProfileId!, params!),
    enabled:
      isAuthenticated &&
      !!staffProfileId &&
      !!params?.to_staff_type,
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
 * ADMIN: tạo yêu cầu điều chuyển (admin directed).
 * Endpoint BE đề xuất: `POST /staff-profiles/:staffProfileId/type-change-requests`.
 */
export function useCreateAdminStaffTypeChangeRequest() {
  const qc = useQueryClient()
  return useMutation<
    ApiStaffTypeChangeRequest,
    Error,
    { staffProfileId: string; payload: CreateStaffTypeChangePayload }
  >({
    mutationFn: ({ staffProfileId, payload }) =>
      createAdminStaffTypeChangeRequestApi(staffProfileId, payload),
    onSuccess: (data) => {
      void qc.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'staff-type-change-requests'],
      })
      void qc.invalidateQueries({
        queryKey: staffQueryKeys.myTypeChangeRequests,
      })
      if (data?.staff_profile_id) {
        void qc.invalidateQueries({
          queryKey: adminQueryKeys.staffTypeChangeHistory(
            data.staff_profile_id,
          ),
        })
        void qc.invalidateQueries({
          queryKey: adminQueryKeys.staffTypeChangeImpact(
            data.staff_profile_id,
          ),
        })
      }
    },
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
    onSuccess: (data) => {
      void qc.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'staff-type-change-requests'],
      })
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
      if (data?.staff_profile_id) {
        void qc.invalidateQueries({
          queryKey: adminQueryKeys.staffTypeChangeHistory(data.staff_profile_id),
        })
      }
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
    onSuccess: (data) => {
      void qc.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'staff-type-change-requests'],
      })
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
      if (data?.staff_profile_id) {
        void qc.invalidateQueries({
          queryKey: adminQueryKeys.staffTypeChangeHistory(data.staff_profile_id),
        })
      }
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
    onSuccess: (data) => {
      void qc.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'staff-type-change-requests'],
      })
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
      if (data?.staff_profile_id) {
        void qc.invalidateQueries({
          queryKey: adminQueryKeys.staffTypeChangeHistory(data.staff_profile_id),
        })
      }
    },
  })
}
