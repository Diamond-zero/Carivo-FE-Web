import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getStaffBookingsApi } from '../../../api/booking.api'
import {
  getAdminLoyaltyCustomerByIdApi,
  getAdminLoyaltyTransactionsApi,
} from '../../../api/loyalty.api'
import {
  adminDeleteUserApi,
  adminUpdateUserApi,
  adminUpdateUserRoleApi,
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
import type { User } from '../../../types/user'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminCustomerListFilters {
  query?: string
  isActiveFilter?: boolean | 'ALL'
}

function filterUsers(users: User[], filters: AdminCustomerListFilters): User[] {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())
  let result = users

  if (filters.isActiveFilter && filters.isActiveFilter !== 'ALL') {
    result = result.filter((user) => user.is_active === filters.isActiveFilter)
  }

  if (!normalizedQuery) return result

  return result.filter((user) => {
    const name = normalizeSearchText(user.full_name)
    const phone = normalizeSearchText(user.phone ?? '')
    const email = normalizeSearchText(user.email ?? '')

    return (
      name.includes(normalizedQuery) ||
      phone.includes(normalizedQuery) ||
      email.includes(normalizedQuery)
    )
  })
}

/**
 * Hook lấy danh sách khách hàng cho admin dùng endpoint `/users?role=CUSTOMER`
 * (BE users module — ADMIN only, Bearer JWT).
 *
 * Trả về cả `customers` (sau filter client-side) và `allCustomers` (toàn bộ
 * trên trang hiện tại) để các StatCard dùng tổng mà không bị ảnh hưởng bởi
 * filter.
 */
export function useAdminCustomers(filters: AdminCustomerListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.customers({
      role: 'CUSTOMER',
      search: filters.query,
      is_active: filters.isActiveFilter,
    }),
    queryFn: async () => {
      const { users } = await getAdminUsersApi({
        role: 'CUSTOMER',
        search: filters.query?.trim() || undefined,
        is_active:
          filters.isActiveFilter && filters.isActiveFilter !== 'ALL'
            ? filters.isActiveFilter
            : undefined,
      })
      return users
        .map(mapApiUser)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi'))
    },
    enabled: isAuthenticated,
    staleTime: 0,
    gcTime: 5 * 60_000,
  })

  const allCustomers: User[] = useMemo(() => query.data ?? [], [query.data])
  const customers = useMemo(
    () => filterUsers(allCustomers, filters),
    [allCustomers, filters],
  )

  return {
    customers,
    allCustomers,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
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
    onMutate: async ({ userId, isActive }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.customers() })
      const previousCustomers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'customers'],
      })
      const previousUsers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'users'],
      })

      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'customers'] },
        (current) => {
          if (!current) return current
          return current.map((user) =>
            user.id === userId ? { ...user, is_active: isActive } : user,
          )
        },
      )
      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'users'] },
        (current) => {
          if (!current) return current
          return current.map((user) =>
            user.id === userId ? { ...user, is_active: isActive } : user,
          )
        },
      )

      return { previousCustomers, previousUsers }
    },
    onError: (_err, _vars, context) => {
      context?.previousCustomers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      context?.previousUsers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
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
    onMutate: async ({ userId, payload }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.customers() })
      const previousCustomers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'customers'],
      })
      const previousUsers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'users'],
      })

      const applyPatch = (user: User) =>
        user.id === userId
          ? {
              ...user,
              full_name: payload.full_name ?? user.full_name,
              email: payload.email ?? user.email,
            }
          : user

      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'customers'] },
        (current) => (current ? current.map(applyPatch) : current),
      )
      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'users'] },
        (current) => (current ? current.map(applyPatch) : current),
      )

      return { previousCustomers, previousUsers }
    },
    onError: (_err, _vars, context) => {
      context?.previousCustomers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      context?.previousUsers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
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
    onMutate: async ({ userId, payload }) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.customers() })
      const previousCustomers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'customers'],
      })
      const previousUsers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'users'],
      })

      const applyPatch = (user: User) =>
        user.id === userId ? { ...user, role: payload.role } : user

      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'customers'] },
        (current) => (current ? current.map(applyPatch) : current),
      )
      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'users'] },
        (current) => (current ? current.map(applyPatch) : current),
      )

      return { previousCustomers, previousUsers }
    },
    onError: (_err, _vars, context) => {
      context?.previousCustomers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      context?.previousUsers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
    },
    onSettled: (_data, _err, variables) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
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
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: adminQueryKeys.customers() })
      await queryClient.cancelQueries({
        queryKey: adminQueryKeys.customer(userId),
      })
      const previousCustomers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'customers'],
      })
      const previousUsers = queryClient.getQueriesData<User[]>({
        queryKey: ['admin', 'users'],
      })
      const previousDetail = queryClient.getQueryData<User>(
        adminQueryKeys.customer(userId),
      )

      const applyPatch = (user: User) =>
        user.id === userId ? { ...user, is_active: false } : user

      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'customers'] },
        (current) => (current ? current.map(applyPatch) : current),
      )
      queryClient.setQueriesData<User[]>(
        { queryKey: ['admin', 'users'] },
        (current) => (current ? current.map(applyPatch) : current),
      )
      if (previousDetail) {
        queryClient.setQueryData<User>(adminQueryKeys.customer(userId), {
          ...previousDetail,
          is_active: false,
        })
      }
      return { previousCustomers, previousUsers, previousDetail }
    },
    onError: (_err, userId, context) => {
      context?.previousCustomers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      context?.previousUsers.forEach(([key, data]) => {
        queryClient.setQueryData(key, data)
      })
      if (context?.previousDetail) {
        queryClient.setQueryData(
          adminQueryKeys.customer(userId),
          context.previousDetail,
        )
      }
    },
    onSettled: (_data, _error, userId) => {
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(userId),
      })
      if (session?.user.id === userId) {
        window.setTimeout(() => window.location.assign('/login'), 800)
      }
    },
  })
}
