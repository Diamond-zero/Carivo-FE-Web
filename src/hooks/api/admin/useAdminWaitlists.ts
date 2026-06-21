import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelAdminWaitlistApi,
  expireAdminWaitlistApi,
  getAdminWaitlistsApi,
  offerAdminWaitlistApi,
  type WaitlistListParams,
} from '../../../api/waitlist.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'

export function useAdminWaitlists(params?: WaitlistListParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.waitlists(params),
    queryFn: () => getAdminWaitlistsApi(params),
    enabled: isAuthenticated,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useAdminWaitlistMutations() {
  const queryClient = useQueryClient()

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.waitlists() })

  const offerMutation = useMutation({
    mutationFn: ({
      waitlistId,
      offerExpiresInMinutes,
    }: {
      waitlistId: string
      offerExpiresInMinutes?: number
    }) => offerAdminWaitlistApi(waitlistId, offerExpiresInMinutes),
    onSuccess: () => void invalidate(),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ waitlistId, note }: { waitlistId: string; note?: string }) =>
      cancelAdminWaitlistApi(waitlistId, note),
    onSuccess: () => void invalidate(),
  })

  const expireMutation = useMutation({
    mutationFn: (waitlistId: string) => expireAdminWaitlistApi(waitlistId),
    onSuccess: () => void invalidate(),
  })

  return { offerMutation, cancelMutation, expireMutation }
}

export const WAITLIST_STATUS_LABELS: Record<string, string> = {
  WAITING: 'Đang chờ',
  OFFERED: 'Đã mời',
  ACCEPTED: 'Đã chấp nhận',
  CANCELED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
}
