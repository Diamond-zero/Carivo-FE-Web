import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getStaffBookingHandoverApi,
  readyBookingHandoverApi,
  releaseBookingHandoverApi,
  walkInAcceptHandoverApi,
  type ApiBookingHandover,
  type ReadyHandoverPayload,
  type ReleaseHandoverPayload,
  type WalkInAcceptHandoverPayload,
} from '../../../api/handover.api'
import { staffQueryKeys } from './queryKeys'

export const staffHandoverQueryKeys = {
  detail: (bookingId: string) => ['staff', 'handover', bookingId] as const,
}

/**
 * Hook lấy handover cho booking ở staff portal.
 *
 * Polling mỗi 5s khi state đang chờ phản hồi khách (READY_FOR_CUSTOMER + PENDING)
 * để UI tự đồng bộ khi khách accept trên app của họ; các trạng thái khác thì
 * on-demand để tránh gọi BE thừa.
 */
export function useStaffBookingHandover(bookingId: string | undefined) {
  return useQuery<ApiBookingHandover>({
    queryKey: staffHandoverQueryKeys.detail(bookingId ?? ''),
    queryFn: () => getStaffBookingHandoverApi(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: (query) => {
      const data = query.state.data
      if (!data) return false
      // Chỉ poll khi đang chờ khách phản hồi.
      if (
        data.state === 'READY_FOR_CUSTOMER' &&
        data.customer_response === 'PENDING'
      ) {
        return 5_000
      }
      return false
    },
  })
}

function invalidateHandoverAndBooking(
  queryClient: ReturnType<typeof useQueryClient>,
  bookingId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: staffHandoverQueryKeys.detail(bookingId),
  })
  void queryClient.invalidateQueries({
    queryKey: ['staff', 'booking', 'detail', bookingId],
  })
  void queryClient.invalidateQueries({
    queryKey: staffQueryKeys.workspaceDetail(bookingId),
  })
  void queryClient.invalidateQueries({
    queryKey: staffQueryKeys.workspaceBookings,
  })
}

/** Mutation: chuẩn bị bàn giao (Bước 2 trong flow BE). */
export function useReadyBookingHandoverMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReadyHandoverPayload = {}) =>
      readyBookingHandoverApi(bookingId, payload),
    onSuccess: () => invalidateHandoverAndBooking(queryClient, bookingId),
  })
}

/** Mutation: staff ghi nhận walk-in khách đã đồng ý tình trạng xe. */
export function useWalkInAcceptHandoverMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: WalkInAcceptHandoverPayload = {}) =>
      walkInAcceptHandoverApi(bookingId, payload),
    onSuccess: () => invalidateHandoverAndBooking(queryClient, bookingId),
  })
}

/** Mutation: bàn giao xe thực tế — yêu cầu payment PAID|WAIVED + response ACCEPTED. */
export function useReleaseBookingHandoverMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReleaseHandoverPayload = {}) =>
      releaseBookingHandoverApi(bookingId, payload),
    onSuccess: () => invalidateHandoverAndBooking(queryClient, bookingId),
  })
}
