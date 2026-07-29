import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getStaffBookingsApi } from '../../../api/booking.api'
import {
  getAdminLoyaltyCustomerByIdApi,
  getAdminLoyaltyTransactionsApi,
} from '../../../api/loyalty.api'
import {
  adminDeleteUserApi,
  adminUpdateUserApi,
  adminUpdateUserRoleApi,
  getAllAdminUsersApi,
  getAdminUsersApi,
  getUserByIdApi,
  updateUserStatusApi,
  type AdminUpdateUserPayload,
  type UpdateUserRolePayload,
} from '../../../api/user.api'
import { getAdminVehiclesApi } from '../../../api/vehicle.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiUser } from '../../../lib/auth/mapApiTypes'
import {
  mapApiLoyaltyDetail,
  mapApiLoyaltyPointTransaction,
  mapApiVehicle,
} from '../../../lib/mappers/adminMappers'
import { mapApiBooking } from '../../../lib/mappers/staffMappers'
import { adminQueryKeys } from './queryKeys'

export interface AdminCustomerListFilters {
  query?: string
  isActiveFilter?: boolean | 'ALL'
}

export function useAllAdminCustomers(filters: AdminCustomerListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.customers({
      scope: 'all',
      search: filters.query,
      is_active: filters.isActiveFilter,
    }),
    queryFn: async () => {
      const users = await getAllAdminUsersApi({
        role: 'CUSTOMER',
        search: filters.query?.trim() || undefined,
        is_active:
          filters.isActiveFilter && filters.isActiveFilter !== 'ALL'
            ? filters.isActiveFilter
            : undefined,
      })
      return users.map(mapApiUser)
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  return {
    allCustomers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminCustomers(
  filters: AdminCustomerListFilters = {},
  page = 1,
  limit = 20,
) {
  const { isAuthenticated } = useAdminAuth()

  const summaryQuery = useQuery({
    queryKey: [...adminQueryKeys.all, 'customer-summary'],
    queryFn: async () => {
      const [allResult, activeResult] = await Promise.all([
        getAdminUsersApi({ role: 'CUSTOMER', limit: 1 }),
        getAdminUsersApi({ role: 'CUSTOMER', is_active: true, limit: 1 }),
      ])
      const total = allResult.meta?.total ?? allResult.users.length
      const active = activeResult.meta?.total ?? activeResult.users.length

      return {
        total,
        active,
        locked: Math.max(total - active, 0),
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const query = useQuery({
    queryKey: adminQueryKeys.customers({
      role: 'CUSTOMER',
      search: filters.query,
      is_active: filters.isActiveFilter,
      page,
      limit,
    }),
    queryFn: async () => {
      const result = await getAdminUsersApi({
        role: 'CUSTOMER',
        page,
        limit,
        search: filters.query?.trim() || undefined,
        is_active:
          filters.isActiveFilter && filters.isActiveFilter !== 'ALL'
            ? filters.isActiveFilter
            : undefined,
      })
      return {
        users: result.users.map(mapApiUser),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 5 * 60_000,
    placeholderData: (previousData) => previousData,
  })

  const customers = query.data?.users ?? []

  return {
    customers,
    meta: query.data?.meta,
    totalCustomers: summaryQuery.data?.total ?? customers.length,
    activeCustomerCount:
      summaryQuery.data?.active ?? customers.filter((user) => user.is_active).length,
    lockedCustomerCount:
      summaryQuery.data?.locked ??
      customers.filter((user) => !user.is_active).length,
    isLoading: query.isLoading || summaryQuery.isLoading,
    isFetching: query.isFetching,
    isError: query.isError || summaryQuery.isError,
    error: query.error ?? summaryQuery.error,
    refetch: query.refetch,
  }
}

/**
 * Hook lấy 1 user (khách hàng / nhân viên) theo `id` từ `GET /users/:id`.
 *
 * Dùng cho các trang con của trang chi tiết khách hàng admin
 * (Phương tiện, Loyalty…) — chỉ cần `full_name` để render header.
 */
export function useAdminCustomer(userId: string | undefined) {
  const { isAuthenticated } = useAdminAuth()
  const query = useQuery({
    queryKey: adminQueryKeys.user(userId ?? ''),
    queryFn: async () => {
      if (!userId) throw new Error('Thiếu mã người dùng')
      return mapApiUser(await getUserByIdApi(userId))
    },
    enabled: isAuthenticated && Boolean(userId),
    staleTime: 30_000,
  })
  return {
    customer: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
  }
}

/**
 * Hook chi tiết khách hàng admin — dùng `/users/:id` làm nguồn chính.
 *
 * Loyalty / tier history / point history / vehicles / bookings là best-effort:
 * fail-soft (không block render, không throw ra UI).
 *
 * BE `GET /admin/loyalty/customers/:id` chỉ trả `LoyaltyOverviewDto` (nested):
 *   { loyalty: { current_tier, total_points, total_spent, ... },
 *     current_tier_rule, next_tier_rule }
 * Nên lịch sử điểm phải fetch riêng qua
 *   `GET /admin/loyalty/customers/:id/transactions`.
 * BE hiện chưa có endpoint trả tier_history → section này để rỗng + empty state.
 */
export function useAdminCustomerDetail(customerId?: string) {
  const { isAuthenticated } = useAdminAuth()

  const userQuery = useQuery({
    queryKey: adminQueryKeys.customer(customerId ?? ''),
    queryFn: async () => mapApiUser(await getUserByIdApi(customerId!)),
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
  })

  const loyaltyQuery = useQuery({
    queryKey: [...adminQueryKeys.customer(customerId ?? ''), 'loyalty'],
    queryFn: async () => {
      const detail = await getAdminLoyaltyCustomerByIdApi(customerId!)
      return mapApiLoyaltyDetail(detail)
    },
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
    retry: false,
  })

  const pointTransactionsQuery = useQuery({
    queryKey: [...adminQueryKeys.customer(customerId ?? ''), 'point-transactions'],
    queryFn: async () => {
      const result = await getAdminLoyaltyTransactionsApi(customerId!, {
        limit: 50,
      })
      return result.transactions.map((item) =>
        mapApiLoyaltyPointTransaction(item, customerId!),
      )
    },
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
    retry: false,
  })

  const vehiclesQuery = useQuery({
    queryKey: adminQueryKeys.vehicles({ customer_id: customerId }),
    queryFn: async () => {
      const result = await getAdminVehiclesApi({ customer_id: customerId })
      return result.vehicles
        .filter((vehicle) => vehicle.is_active)
        .map(mapApiVehicle)
    },
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
    retry: false,
  })

  const bookingsQuery = useQuery({
    queryKey: adminQueryKeys.bookings({ customer_id: customerId }),
    queryFn: async () => {
      const result = await getStaffBookingsApi({
        customer_id: customerId,
        limit: 100,
      })
      return result.bookings
        .map(mapApiBooking)
        .sort(
          (a, b) =>
            new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
        )
    },
    enabled: isAuthenticated && Boolean(customerId),
    staleTime: 30_000,
    retry: false,
  })

  return {
    user: userQuery.data ?? null,
    loyalty: loyaltyQuery.data?.loyalty ?? null,
    currentTierRule: loyaltyQuery.data?.currentTierRule ?? null,
    nextTierRule: loyaltyQuery.data?.nextTierRule ?? null,
    tierHistory: [],
    pointHistory: pointTransactionsQuery.data ?? [],
    vehicles: vehiclesQuery.data ?? [],
    bookings: bookingsQuery.data ?? [],
    isLoading: userQuery.isLoading,
    isError: userQuery.isError,
    error: userQuery.error ?? null,
    loyaltyError: loyaltyQuery.error,
    pointTransactionsError: pointTransactionsQuery.error,
    vehiclesError: vehiclesQuery.error,
    bookingsError: bookingsQuery.error,
    refetch: () => {
      void userQuery.refetch()
      void loyaltyQuery.refetch()
      void pointTransactionsQuery.refetch()
      void vehiclesQuery.refetch()
      void bookingsQuery.refetch()
    },
  }
}

export function useUpdateAdminCustomerStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string
      isActive: boolean
    }) => updateUserStatusApi(userId, isActive),
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
    },
  })
}

export function useUpdateAdminCustomer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string
      payload: AdminUpdateUserPayload
    }) => mapApiUser(await adminUpdateUserApi(userId, payload)),
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
    },
  })
}

export function useUpdateAdminCustomerRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string
      payload: UpdateUserRolePayload
    }) => mapApiUser(await adminUpdateUserRoleApi(userId, payload)),
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
    },
  })
}

export function useDeleteAdminCustomer() {
  const queryClient = useQueryClient()
  const { session } = useAdminAuth()

  return useMutation({
    mutationFn: async (userId: string) => {
      await adminDeleteUserApi(userId)
      return userId
    },
    onSettled: (_data, _error, userId) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(userId),
      })
      if (session?.user.id === userId) {
        window.setTimeout(() => window.location.assign('/login'), 800)
      }
    },
  })
}
