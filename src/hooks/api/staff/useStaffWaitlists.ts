import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  cancelAdminWaitlistApi,
  expireAdminWaitlistApi,
  getAdminWaitlistsApi,
  offerAdminWaitlistApi,
  type OfferAdminWaitlistPayload,
  type WaitlistListParams,
} from '../../../api/waitlist.api'
import { useAuth } from '../../../contexts/AuthContext'
import { staffQueryKeys } from './queryKeys'

const DEFAULT_OFFER_EXPIRE_MINUTES = 15
const DEFAULT_PAGE_SIZE = 20

export function useStaffWaitlists(params?: WaitlistListParams) {
  const { session } = useAuth()
  const garageId = session?.garage?.id

  return useQuery({
    queryKey: [...staffQueryKeys.waitlists(garageId), params],
    queryFn: () =>
      getAdminWaitlistsApi({
        limit: DEFAULT_PAGE_SIZE,
        ...(garageId ? { garage_id: garageId } : {}),
        ...params,
      }),
    enabled: Boolean(session),
    staleTime: 0,
    refetchOnMount: 'always',
  })
}

export function useStaffWaitlistMutations() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const garageId = session?.garage?.id

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: staffQueryKeys.waitlists(garageId) })

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

export const WAITLIST_STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  WAITING: 'info',
  OFFERED: 'warning',
  ACCEPTED: 'success',
  CANCELED: 'default',
  EXPIRED: 'danger',
}