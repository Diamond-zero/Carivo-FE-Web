import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getBookingHandoverApi,
  readyBookingHandoverApi,
  releaseBookingHandoverApi,
  type ReadyHandoverPayload,
  type ReleaseHandoverPayload,
} from '../../../api/handover.api'

export const staffHandoverQueryKeys = {
  detail: (bookingId: string) => ['staff', 'handover', bookingId] as const,
}

export function useStaffBookingHandover(bookingId: string | undefined) {
  return useQuery({
    queryKey: staffHandoverQueryKeys.detail(bookingId ?? ''),
    queryFn: () => getBookingHandoverApi(bookingId!),
    enabled: Boolean(bookingId),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useReadyBookingHandoverMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReadyHandoverPayload = {}) =>
      readyBookingHandoverApi(bookingId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffHandoverQueryKeys.detail(bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: ['staff', 'booking', 'detail', bookingId] })
    },
  })
}

export function useReleaseBookingHandoverMutation(bookingId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: ReleaseHandoverPayload) =>
      releaseBookingHandoverApi(bookingId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: staffHandoverQueryKeys.detail(bookingId),
      })
      void queryClient.invalidateQueries({ queryKey: ['staff', 'booking', 'detail', bookingId] })
    },
  })
}