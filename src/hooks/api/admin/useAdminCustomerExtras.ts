import { useQuery } from '@tanstack/react-query'
import {
  getAdminLoyaltyCustomerByIdApi,
  getAdminLoyaltyTransactionsApi,
  type LoyaltyTransactionsParams,
} from '../../../api/loyalty.api'
import { getMyNotificationsApi, type NotificationListParams } from '../../../api/notification.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { adminQueryKeys } from './queryKeys'

export function useAdminCustomerNotifications(
  customerId: string | undefined,
  params?: NotificationListParams,
) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: [...adminQueryKeys.notifications(customerId), params],
    queryFn: () => getMyNotificationsApi(params),
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
  })
}

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

export function useAdminCustomerLoyalty(customerId: string | undefined) {
  const { isAuthenticated } = useAdminAuth()
  return useQuery({
    queryKey: adminQueryKeys.loyaltyCustomer(customerId),
    queryFn: () => getAdminLoyaltyCustomerByIdApi(customerId!),
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
  })
}