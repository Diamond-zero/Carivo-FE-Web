import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelAdminWaitlistApi,
  expireAdminWaitlistApi,
  getAdminWaitlistsApi,
  offerAdminWaitlistApi,
  type OfferAdminWaitlistPayload,
  type WaitlistListParams,
} from '../../../api/waitlist.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'

const DEFAULT_OFFER_EXPIRE_MINUTES = 15
const DEFAULT_PAGE_SIZE = 20

export function useAdminWaitlists(params?: WaitlistListParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.waitlists(params),
    queryFn: () =>
      getAdminWaitlistsApi({
        limit: DEFAULT_PAGE_SIZE,
        ...params,
      }),
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
    mutationFn: (payload: OfferAdminWaitlistPayload) => offerAdminWaitlistApi(payload),
    onSuccess: () => void invalidate(),
  })

  const cancelMutation = useMutation({
    mutationFn: ({ waitlistId, reason }: { waitlistId: string; reason?: string }) =>
      cancelAdminWaitlistApi(waitlistId, reason),
    onSuccess: () => void invalidate(),
  })

  const expireMutation = useMutation({
    mutationFn: (waitlistId: string) => expireAdminWaitlistApi(waitlistId),
    onSuccess: () => void invalidate(),
  })

  return { offerMutation, cancelMutation, expireMutation }
}

export { DEFAULT_OFFER_EXPIRE_MINUTES }

export const WAITLIST_STATUS_LABELS: Record<string, string> = {
  WAITING: 'Đang chờ',
  OFFERED: 'Đã mời',
  ACCEPTED: 'Đã chấp nhận',
  CANCELED: 'Đã hủy',
  EXPIRED: 'Hết hạn',
}