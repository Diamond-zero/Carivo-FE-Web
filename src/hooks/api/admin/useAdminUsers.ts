import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  adminDeleteUserApi,
  adminUpdateUserApi,
  adminUpdateUserRoleApi,
  getAdminUsersApi,
  updateUserStatusApi,
  type AdminUpdateUserPayload,
  type UpdateUserRolePayload,
  type UserListParams,
} from '../../../api/user.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiUser } from '../../../lib/auth/mapApiTypes'
import type { UserRole } from '../../../types/user'
import { normalizeSearchText } from '../../../utils/booking'
import { adminQueryKeys } from './queryKeys'

export interface AdminUsersListFilters {
  query?: string
  roleFilter?: UserRole | 'ALL'
  isActiveFilter?: boolean | 'ALL'
}

function filterUsers(
  users: ReturnType<typeof mapApiUser>[],
  filters: AdminUsersListFilters,
) {
  const normalizedQuery = normalizeSearchText((filters.query ?? '').trim())
  let result = users

  if (filters.roleFilter && filters.roleFilter !== 'ALL') {
    result = result.filter((user) => user.role === filters.roleFilter)
  }

  if (filters.isActiveFilter && filters.isActiveFilter !== 'ALL') {
    result = result.filter((user) => user.is_active === filters.isActiveFilter)
  }

  if (!normalizedQuery) return result

  return result.filter((user) => {
    const name = normalizeSearchText(user.full_name)
    const phone = normalizeSearchText(user.phone)
    const email = normalizeSearchText(user.email ?? '')

    return (
      name.includes(normalizedQuery) ||
      phone.includes(normalizedQuery) ||
      email.includes(normalizedQuery)
    )
  })
}

export function useAdminUsers(filters: AdminUsersListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()

  const query = useQuery({
    queryKey: adminQueryKeys.users({
      search: filters.query,
      role: filters.roleFilter,
      is_active: filters.isActiveFilter,
    }),
    queryFn: async () => {
      const apiParams: UserListParams = {
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
      const { users } = await getAdminUsersApi(apiParams)
      return users
        .map(mapApiUser)
        .sort((a, b) => a.full_name.localeCompare(b.full_name, 'vi'))
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const allUsers = query.data ?? []
  const users = useMemo(
    () => filterUsers(allUsers, filters),
    [allUsers, filters.query, filters.roleFilter, filters.isActiveFilter],
  )

  return {
    users,
    allUsers,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
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
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
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
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
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
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.customer(variables.userId),
      })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
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
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.customers() })
      void queryClient.invalidateQueries({ queryKey: adminQueryKeys.users() })
      void queryClient.removeQueries({ queryKey: adminQueryKeys.customer(userId) })
      if (session?.user.id === userId) {
        // Hard delete of self: handled by BE wiping tokens. Force reload to logout.
        window.setTimeout(() => window.location.assign('/login'), 800)
      }
    },
  })
}