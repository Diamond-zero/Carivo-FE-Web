import { useQuery } from '@tanstack/react-query'
import {
  getAdminLoyaltyTransactionsApi,
  type LoyaltyTransactionsParams,
} from '../../../api/loyalty.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'

export function useAdminCustomerLoyaltyTransactions(
  customerId: string | undefined,
  params?: Omit<LoyaltyTransactionsParams, 'customer_id'>,
) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: adminQueryKeys.loyaltyTransactions({ ...params, customer_id: customerId }),
    queryFn: async () => {
      if (!customerId) throw new Error('Thiếu mã khách hàng')
      return getAdminLoyaltyTransactionsApi(customerId, params)
    },
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
  })
}