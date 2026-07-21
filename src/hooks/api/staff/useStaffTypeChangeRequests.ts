import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMyStaffCapabilitiesApi } from '../../../api/staffCapabilities.api'
import {
  cancelStaffTypeChangeRequestApi,
  createStaffTypeChangeRequestApi,
  getMyStaffTypeChangeRequestsApi,
  type CreateStaffTypeChangePayload,
  type CancelStaffTypeChangePayload,
} from '../../../api/staffTypeChange.api'
import { useAuth } from '../../../contexts/AuthContext'
import { adminQueryKeys } from '../admin/queryKeys'
import { staffQueryKeys } from './queryKeys'

/**
 * Hook STAFF: lấy capabilities của nhân viên hiện đang đăng nhập.
 *
 * Sử dụng thay thế cho việc gọi trực tiếp `/staff-profiles/me/capabilities`
 * (vốn đang bị 401/403 trong stack trace người dùng báo cáo).
 */
export function useStaffCapabilities() {
  const { session } = useAuth()
  const isStaff = !!session && session.user.role === 'STAFF'

  return useQuery({
    queryKey: staffQueryKeys.capabilities,
    queryFn: getMyStaffCapabilitiesApi,
    enabled: isStaff,
    staleTime: 30_000,
    refetchOnMount: 'always',
    retry: 0,
  })
}

/**
 * Hook STAFF: danh sách yêu cầu đổi chức năng mà tôi đã gửi.
 */
export function useMyStaffTypeChangeRequests() {
  const { session } = useAuth()
  const isStaff = !!session && session.user.role === 'STAFF'

  return useQuery({
    queryKey: staffQueryKeys.myTypeChangeRequests,
    queryFn: getMyStaffTypeChangeRequestsApi,
    enabled: isStaff,
    staleTime: 15_000,
  })
}

/**
 * Hook STAFF: tạo yêu cầu đổi chức năng.
 * Khi thành công sẽ invalidate `myTypeChangeRequests` (staff view) và
 * cả admin list (`admin/staff-type-change-requests`) để danh sách admin
 * được cập nhật nếu admin đang mở song song.
 */
export function useCreateStaffTypeChangeRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateStaffTypeChangePayload) =>
      createStaffTypeChangeRequestApi(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
      void qc.invalidateQueries({
        queryKey: adminQueryKeys.staffTypeChangeRequests(),
      })
      void qc.invalidateQueries({ queryKey: staffQueryKeys.capabilities })
    },
  })
}

/**
 * Hook STAFF: tự hủy yêu cầu đổi (chỉ áp dụng với request của chính mình
 * và đang ở trạng thái REQUESTED/APPROVED chưa apply).
 */
export function useCancelMyStaffTypeChangeRequest() {
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
      void qc.invalidateQueries({ queryKey: staffQueryKeys.myTypeChangeRequests })
      void qc.invalidateQueries({
        queryKey: adminQueryKeys.staffTypeChangeRequests(),
      })
    },
  })
}
