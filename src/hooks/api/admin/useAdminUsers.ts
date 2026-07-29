import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  adminDeleteUserApi,
  adminUpdateUserApi,
  adminUpdateUserRoleApi,
  getAllAdminUsersApi,
  getAdminUsersApi,
  updateUserStatusApi,
  type AdminUpdateUserPayload,
  type UpdateUserRolePayload,
  type UserListParams,
} from '../../../api/user.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiUser } from '../../../lib/auth/mapApiTypes'
import type { UserRole } from '../../../types/user'
import { adminQueryKeys } from './queryKeys'

export interface AdminUsersListFilters {
  query?: string
  roleFilter?: UserRole | 'ALL'
  isActiveFilter?: boolean | 'ALL'
}

export function useAllAdminUsers(filters: AdminUsersListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.users({
      scope: 'all',
      search: filters.query,
      role: filters.roleFilter,
      is_active: filters.isActiveFilter,
    }),
    queryFn: async () => {
      const users = await getAllAdminUsersApi({
        search: filters.query?.trim() || undefined,
        role:
          filters.roleFilter && filters.roleFilter !== 'ALL'
            ? filters.roleFilter
            : undefined,
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
    allUsers: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminUsers(
  filters: AdminUsersListFilters = {},
  page = 1,
  limit = 20,
) {
  const { isAuthenticated } = useAdminAuth()

  const summaryQuery = useQuery({
    queryKey: [...adminQueryKeys.all, 'user-summary'],
    queryFn: async () => {
      const [allResult, activeResult, adminResult, staffResult] =
        await Promise.all([
          getAdminUsersApi({ limit: 1 }),
          getAdminUsersApi({ is_active: true, limit: 1 }),
          getAdminUsersApi({ role: 'ADMIN', limit: 1 }),
          getAdminUsersApi({ role: 'STAFF', limit: 1 }),
        ])
      const total = allResult.meta?.total ?? allResult.users.length
      const active = activeResult.meta?.total ?? activeResult.users.length

      return {
        total,
        active,
        locked: Math.max(total - active, 0),
        admins: adminResult.meta?.total ?? adminResult.users.length,
        staff: staffResult.meta?.total ?? staffResult.users.length,
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const listParams: UserListParams = {
    page,
    limit,
    search: filters.query?.trim() || undefined,
    role:
      filters.roleFilter && filters.roleFilter !== 'ALL'
        ? filters.roleFilter
        : undefined,
    is_active:
      filters.isActiveFilter && filters.isActiveFilter !== 'ALL'
        ? filters.isActiveFilter
        : undefined,
  }

  const query = useQuery({
    queryKey: adminQueryKeys.users({
      ...listParams,
    }),
    queryFn: async () => {
      const result = await getAdminUsersApi(listParams)
      return {
        users: result.users.map(mapApiUser),
        meta: result.meta,
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  })

  const users = query.data?.users ?? []

  return {
    users,
    meta: query.data?.meta,
    totalUsers: summaryQuery.data?.total ?? users.length,
    activeUserCount:
      summaryQuery.data?.active ?? users.filter((user) => user.is_active).length,
    lockedUserCount:
      summaryQuery.data?.locked ??
      users.filter((user) => !user.is_active).length,
    adminCount:
      summaryQuery.data?.admins ??
      users.filter((user) => user.role === 'ADMIN').length,
    staffCount:
      summaryQuery.data?.staff ??
      users.filter((user) => user.role === 'STAFF').length,
    isLoading: query.isLoading || summaryQuery.isLoading,
    isFetching: query.isFetching,
    isError: query.isError || summaryQuery.isError,
    error: query.error ?? summaryQuery.error,
    refetch: query.refetch,
  }
}

export function useAdminUpdateUserStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      isActive,
    }: {
      userId: string
      isActive: boolean
    }) => updateUserStatusApi(userId, isActive),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
    },
  })
}

export function useAdminUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string
      payload: AdminUpdateUserPayload
    }) => mapApiUser(await adminUpdateUserApi(userId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
    },
  })
}

export function useAdminUpdateUserRole() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string
      payload: UpdateUserRolePayload
    }) => mapApiUser(await adminUpdateUserRoleApi(userId, payload)),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
    },
  })
}

export function useAdminDeleteUser() {
  const queryClient = useQueryClient()
  const { session } = useAdminAuth()

  return useMutation({
    mutationFn: async (userId: string) => {
      await adminDeleteUserApi(userId)
      return userId
    },
    onSuccess: (_data, userId) => {
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customers'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'users'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'customer-summary'],
      })
      void queryClient.invalidateQueries({
        queryKey: [...adminQueryKeys.all, 'user-summary'],
      })
      void queryClient.removeQueries({ queryKey: adminQueryKeys.customer(userId) })
      if (session?.user.id === userId) {
        // Hard delete of self: handled by BE wiping tokens. Force reload to logout.
        window.setTimeout(() => window.location.assign('/login'), 800)
      }
    },
  })
}
