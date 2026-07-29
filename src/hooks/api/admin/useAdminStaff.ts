import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo } from 'react'
import { getAdminGaragesApi } from '../../../api/garage.api'
import {
  createStaffProfileApi,
  deleteStaffProfileApi,
  getAllStaffProfilesApi,
  getStaffProfileByIdApi,
  getStaffProfilesApi,
  toggleStaffProfileStatusApi,
  updateStaffProfileApi,
  type StaffProfileCreatePayload,
  type StaffProfileListParams,
  type StaffProfileUpdatePayload,
} from '../../../api/staffProfile.api'
import { getAllAdminUsersApi } from '../../../api/user.api'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { mapApiStaffRecord } from '../../../lib/mappers/adminMappers'
import { mapApiUser } from '../../../lib/auth/mapApiTypes'
import type { AdminStaffRecord } from '../../../types/admin'
import type { StaffType } from '../../../types/staffProfile'
import { adminQueryKeys } from './queryKeys'

export interface AdminStaffListFilters {
  query?: string
  garageFilter?: string | 'ALL'
  staffTypeFilter?: StaffType | 'ALL'
  isActiveFilter?: boolean | 'ALL'
}

function buildStaffFilters(
  filters: AdminStaffListFilters,
): Omit<StaffProfileListParams, 'page' | 'limit'> {
  const params: Omit<StaffProfileListParams, 'page' | 'limit'> = {}
  const trimmedSearch = filters.query?.trim()
  if (trimmedSearch) {
    params.search = trimmedSearch
  }
  if (filters.staffTypeFilter && filters.staffTypeFilter !== 'ALL') {
    params.staff_type = filters.staffTypeFilter
  }
  if (filters.garageFilter && filters.garageFilter !== 'ALL') {
    params.garage_id = filters.garageFilter
  }
  if (filters.isActiveFilter && filters.isActiveFilter !== 'ALL') {
    params.is_active = filters.isActiveFilter
  }
  return params
}

function buildStaffListParams(
  filters: AdminStaffListFilters,
  page: number,
  limit: number,
): StaffProfileListParams {
  return {
    ...buildStaffFilters(filters),
    page,
    limit,
  }
}

async function fetchAdminStaffRecords(params: StaffProfileListParams) {
  const [{ profiles, meta }, { garages }] = await Promise.all([
    getStaffProfilesApi(params),
    getAdminGaragesApi(),
  ])

  const garageById = new Map(garages.map((garage) => [garage.id, garage]))

  const staff = profiles
    .map((profile) =>
      mapApiStaffRecord(profile, garageById.get(profile.garage_id ?? '') ?? null),
    )
    .filter((record): record is AdminStaffRecord => record !== null)

  return { staff, meta }
}

async function fetchAllAdminStaffRecords(
  params: Omit<StaffProfileListParams, 'page' | 'limit'>,
) {
  const [profiles, { garages }] = await Promise.all([
    getAllStaffProfilesApi(params),
    getAdminGaragesApi(),
  ])
  const garageById = new Map(garages.map((garage) => [garage.id, garage]))

  return profiles
    .map((profile) =>
      mapApiStaffRecord(profile, garageById.get(profile.garage_id ?? '') ?? null),
    )
    .filter((record): record is AdminStaffRecord => record !== null)
}

export function useAllAdminStaff(filters: AdminStaffListFilters = {}) {
  const { isAuthenticated } = useAdminAuth()
  const listParams = useMemo(() => buildStaffFilters(filters), [filters])

  const query = useQuery({
    queryKey: adminQueryKeys.staff({ scope: 'all', ...listParams }),
    queryFn: () => fetchAllAdminStaffRecords(listParams),
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  return {
    allStaff: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

export function useAdminStaff(
  filters: AdminStaffListFilters = {},
  page = 1,
  limit = 20,
) {
  const { isAuthenticated } = useAdminAuth()

  const listParams = useMemo(
    () => buildStaffListParams(filters, page, limit),
    [filters, page, limit],
  )

  const summaryQuery = useQuery({
    queryKey: [...adminQueryKeys.all, 'staff', 'summary'],
    queryFn: async () => {
      const [allResult, activeResult] = await Promise.all([
        getStaffProfilesApi({ limit: 1 }),
        getStaffProfilesApi({ is_active: true, limit: 1 }),
      ])
      const total = allResult.meta?.total ?? allResult.profiles.length
      const active = activeResult.meta?.total ?? activeResult.profiles.length

      return {
        total,
        active,
        inactive: Math.max(total - active, 0),
      }
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })

  const query = useQuery({
    queryKey: adminQueryKeys.staff(listParams),
    queryFn: () => fetchAdminStaffRecords(listParams),
    enabled: isAuthenticated,
    staleTime: 30_000,
    placeholderData: (previousData) => previousData,
  })

  const staff = query.data?.staff ?? []

  return {
    staff,
    meta: query.data?.meta,
    totalStaff: summaryQuery.data?.total ?? staff.length,
    activeStaffCount:
      summaryQuery.data?.active ??
      staff.filter((record) => record.profile.is_active).length,
    inactiveStaffCount:
      summaryQuery.data?.inactive ??
      staff.filter((record) => !record.profile.is_active).length,
    isLoading: query.isLoading || summaryQuery.isLoading,
    isFetching: query.isFetching,
    isError: query.isError || summaryQuery.isError,
    error: query.error ?? summaryQuery.error,
    refetch: query.refetch,
  }
}

export function useAdminStaffProfile(profileId?: string) {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: adminQueryKeys.staffProfile(profileId ?? ''),
    queryFn: async () => {
      const [profile, { garages }] = await Promise.all([
        getStaffProfileByIdApi(profileId!),
        getAdminGaragesApi(),
      ])
      const garageKey = profile.garage_id ?? ''
      const garage = garages.find((item) => item.id === garageKey) ?? null
      return mapApiStaffRecord(profile, garage)
    },
    enabled: isAuthenticated && Boolean(profileId),
    staleTime: 30_000,
  })
}

export function useAdminStaffUsersWithoutProfile() {
  const { isAuthenticated } = useAdminAuth()

  return useQuery({
    queryKey: [...['admin', 'staff'], 'users-without-profile'],
    queryFn: async () => {
      const [users, profiles] = await Promise.all([
        getAllAdminUsersApi({ role: 'STAFF' }),
        getAllStaffProfilesApi(),
      ])
      const profileUserIds = new Set(
        profiles.map((profile) => profile.user_id).filter(Boolean),
      )
      return users
        .filter((user) => !profileUserIds.has(user.id))
        .map(mapApiUser)
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  })
}

export function useCreateAdminStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: StaffProfileCreatePayload) => {
      const profile = await createStaffProfileApi(payload)
      const { garages } = await getAdminGaragesApi()
      const garageKey = profile.garage_id ?? ''
      const garage = garages.find((item) => item.id === garageKey) ?? null
      const record = mapApiStaffRecord(profile, garage)
      if (!record) {
        throw new Error('Không thể tạo hồ sơ nhân viên.')
      }
      return record
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
    },
  })
}

export function useUpdateAdminStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      payload,
    }: {
      profileId: string
      payload: StaffProfileUpdatePayload
    }) => {
      const profile = await updateStaffProfileApi(profileId, payload)
      const { garages } = await getAdminGaragesApi()
      const garageKey = profile.garage_id ?? ''
      const garage = garages.find((item) => item.id === garageKey) ?? null
      const record = mapApiStaffRecord(profile, garage)
      if (!record) {
        throw new Error('Không thể cập nhật hồ sơ nhân viên.')
      }
      return record
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.staffProfile(variables.profileId),
      })
    },
  })
}

export function useToggleAdminStaffStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      profileId,
      isActive,
    }: {
      profileId: string
      isActive: boolean
    }) => {
      const profile = await toggleStaffProfileStatusApi(profileId, isActive)
      const { garages } = await getAdminGaragesApi()
      const garageKey = profile.garage_id ?? ''
      const garage = garages.find((item) => item.id === garageKey) ?? null
      const record = mapApiStaffRecord(profile, garage)
      if (!record) {
        throw new Error('Không thể thay đổi trạng thái nhân viên.')
      }
      return record
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      void queryClient.invalidateQueries({
        queryKey: adminQueryKeys.staffProfile(variables.profileId),
      })
    },
  })
}

export function useDeleteAdminStaff() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (profileId: string) => {
      await deleteStaffProfileApi(profileId)
      return profileId
    },
    onSettled: (_data, _error, profileId) => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'staff'] })
      void queryClient.removeQueries({ queryKey: adminQueryKeys.staffProfile(profileId) })
    },
  })
}
