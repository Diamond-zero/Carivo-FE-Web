import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  expireAdminLoyaltyPointsApi,
  getAdminExpiringPointsApi,
  getAdminLoyaltyTransactionsListApi,
  type ExpiringPointsParams,
} from '../../../api/loyalty.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'

export function useAdminExpiringPoints(params?: ExpiringPointsParams) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.expiringPoints(params),
    queryFn: () => getAdminExpiringPointsApi(params),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useAdminLoyaltyTransactions(params?: {
  page?: number
  limit?: number
  customer_id?: string
}) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.loyaltyTransactions(params),
    queryFn: () => getAdminLoyaltyTransactionsListApi(params),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useExpireLoyaltyPoints() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => expireAdminLoyaltyPointsApi(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.expiringPoints() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.loyaltyTransactions() })
    },
  })
}
